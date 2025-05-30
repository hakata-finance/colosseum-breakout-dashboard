import { NextResponse } from 'next/server';
import { ColosseumProjectsResponse } from '@/types/project';
import { validateProjects, getSecurityHeaders, apiRateLimiter } from '@/lib/validation';

const API_CONFIG = {
  COLOSSEUM_API_URL: 'https://api.colosseum.org/api/projects',
  HACKATHON_ID: '4',
  PROJECT_LIMIT: '1450',
  TIMEOUT: 30000, // 30 seconds
};

async function fetchFreshData(): Promise<ColosseumProjectsResponse['projects']> {
  const apiUrl = `${API_CONFIG.COLOSSEUM_API_URL}?hackathonId=${API_CONFIG.HACKATHON_ID}&limit=${API_CONFIG.PROJECT_LIMIT}&showWinnersOnly=false&sort=RANDOM`;
  
  console.log('Fetching fresh data from:', apiUrl);
  
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), API_CONFIG.TIMEOUT);
  
  try {
    const response = await fetch(apiUrl, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Colosseum-Dashboard/1.0',
        'Accept': 'application/json',
        'Cache-Control': 'no-cache',
      },
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}: ${response.statusText}`);
    }
    
    const result: ColosseumProjectsResponse = await response.json();
    
    if (!result || !result.projects || !Array.isArray(result.projects)) {
      throw new Error('Invalid API response format');
    }
    
    const validatedProjects = validateProjects(result.projects);
    
    if (validatedProjects.length === 0) {
      throw new Error('No valid projects after validation');
    }
    
    // Calculate teamSize from teamMembers array length
    const projectsWithTeamSize = validatedProjects.map((project) => ({
      ...project,
      teamSize: project.teamMembers ? project.teamMembers.length : 1
    }));
    
    console.log(`Successfully fetched ${projectsWithTeamSize.length} projects`);
    return projectsWithTeamSize;
    
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
}

export async function GET(request: Request) {
  const startTime = Date.now();
  
  try {
    // Rate limiting
    if (!apiRateLimiter.canMakeRequest()) {
      const timeUntilReset = apiRateLimiter.getTimeUntilReset();
      return NextResponse.json(
        { 
          error: 'Rate limit exceeded',
          retryAfter: Math.ceil(timeUntilReset / 1000)
        },
        { 
          status: 429,
          headers: {
            ...getSecurityHeaders(),
            'Retry-After': Math.ceil(timeUntilReset / 1000).toString(),
          }
        }
      );
    }

    // Fetch fresh data
    const projectsData = await fetchFreshData();
    
    const responseTime = Date.now() - startTime;
    console.log(`API request completed in ${responseTime}ms`);
    
    return NextResponse.json(projectsData, {
      headers: {
        ...getSecurityHeaders(),
        // 🎯 CDN MAGIC: Cloudflare will handle stale-while-revalidate automatically
        'Cache-Control': 'public, max-age=60, stale-while-revalidate=3600, stale-if-error=86400',
        // Cache fresh data for 1 minute
        // Serve stale data for up to 1 hour while revalidating in background  
        // Serve stale data for up to 24 hours if origin is down
        
        // Additional Cloudflare-specific headers
        'CF-Cache-Status': 'DYNAMIC', // Will become HIT after first request
        'Vary': 'Accept-Encoding',
        
        // Response metadata
        'X-Response-Time': `${responseTime}ms`,
        'X-Project-Count': projectsData.length.toString(),
        'X-Timestamp': new Date().toISOString(),
      }
    });
    
  } catch (error) {
    const responseTime = Date.now() - startTime;
    console.error('Failed to fetch projects:', error);
    
    const errorDetails = {
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
      responseTime,
      url: request.url,
    };
    
    console.error('API Error Details:', errorDetails);
    
    if (error instanceof Error && error.name === 'AbortError') {
      return NextResponse.json(
        { error: 'Request timeout' },
        { 
          status: 504,
          headers: {
            ...getSecurityHeaders(),
            'X-Response-Time': `${responseTime}ms`,
            // Don't cache errors for too long
            'Cache-Control': 'public, max-age=30, stale-while-revalidate=300',
          }
        }
      );
    }
    
    return NextResponse.json(
      { 
        error: 'Failed to fetch projects from API',
        details: process.env.NODE_ENV === 'development' ? errorDetails : undefined
      },
      { 
        status: 500,
        headers: {
          ...getSecurityHeaders(),
          'X-Response-Time': `${responseTime}ms`,
          // Don't cache server errors for too long
          'Cache-Control': 'public, max-age=30, stale-while-revalidate=300',
        }
      }
    );
  }
}

export async function POST() {
  return NextResponse.json(
    { error: 'Method not allowed' },
    { status: 405, headers: getSecurityHeaders() }
  );
}

export async function PUT() {
  return NextResponse.json(
    { error: 'Method not allowed' },
    { status: 405, headers: getSecurityHeaders() }
  );
}

export async function DELETE() {
  return NextResponse.json(
    { error: 'Method not allowed' },
    { status: 405, headers: getSecurityHeaders() }
  );
}
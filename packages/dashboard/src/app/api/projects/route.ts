import { NextResponse } from 'next/server';
import { ColosseumProjectsResponse } from '@/types/project';
import { validateProjects, getSecurityHeaders, apiRateLimiter } from '@/lib/validation';

const API_CONFIG = {
  COLOSSEUM_API_URL: 'https://api.colosseum.org/api/projects',
  HACKATHON_ID: '4',
  PROJECT_LIMIT: '1450',
  TIMEOUT: 30000, // 30 seconds
};

// In-memory cache for API responses
let cache: {
  data: ColosseumProjectsResponse['projects'] | null;
  timestamp: number;
  ttl: number;
} = {
  data: null,
  timestamp: 0,
  ttl: 5 * 60 * 1000, // 5 minutes
};

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

    // Check cache first
    const now = Date.now();
    if (cache.data && (now - cache.timestamp < cache.ttl)) {
      console.log('Serving from cache');
      return NextResponse.json(cache.data, {
        headers: {
          ...getSecurityHeaders(),
          'Cache-Control': 'public, max-age=300',
          'X-Cache': 'HIT',
          'X-Response-Time': `${Date.now() - startTime}ms`,
        }
      });
    }

    const apiUrl = `${API_CONFIG.COLOSSEUM_API_URL}?hackathonId=${API_CONFIG.HACKATHON_ID}&limit=${API_CONFIG.PROJECT_LIMIT}&showWinnersOnly=false&sort=RANDOM`;
    
    console.log('Fetching from external API:', apiUrl);
    
    // Create AbortController for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), API_CONFIG.TIMEOUT);
    
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
    
    if (result.projects.length === 0) {
      throw new Error('No projects found in API response');
    }
    
    console.log(`Received ${result.projects.length} projects from API`);
    
    // Validate and sanitize the data
    const validatedProjects = validateProjects(result.projects);
    
    if (validatedProjects.length === 0) {
      throw new Error('No valid projects after validation');
    }
    
    console.log(`${validatedProjects.length} projects passed validation`);
    
    // Calculate teamSize from teamMembers array length
    const projectsWithTeamSize = validatedProjects.map((project) => ({
      ...project,
      teamSize: project.teamMembers ? project.teamMembers.length : 1
    }));
    
    // Update cache
    cache = {
      data: projectsWithTeamSize,
      timestamp: now,
      ttl: cache.ttl,
    };
    
    const responseTime = Date.now() - startTime;
    console.log(`API request completed in ${responseTime}ms`);
    
    return NextResponse.json(projectsWithTeamSize, {
      headers: {
        ...getSecurityHeaders(),
        'Cache-Control': 'public, max-age=300, stale-while-revalidate=60',
        'X-Cache': 'MISS',
        'X-Response-Time': `${responseTime}ms`,
        'X-Project-Count': projectsWithTeamSize.length.toString(),
      }
    });
  } catch (error) {
    const responseTime = Date.now() - startTime;
    console.error('Failed to fetch projects:', error);
    
    // Log error details for monitoring
    const errorDetails = {
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
      responseTime,
      url: request.url,
    };
    
    console.error('API Error Details:', errorDetails);
    
    // Return appropriate error response
    if (error instanceof Error && error.name === 'AbortError') {
      return NextResponse.json(
        { error: 'Request timeout' },
        { 
          status: 504,
          headers: {
            ...getSecurityHeaders(),
            'X-Response-Time': `${responseTime}ms`,
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
        }
      }
    );
  }
}

// Optional: Add other HTTP methods if needed
export async function POST() {
  return NextResponse.json(
    { error: 'Method not allowed' },
    { 
      status: 405,
      headers: getSecurityHeaders()
    }
  );
}

export async function PUT() {
  return NextResponse.json(
    { error: 'Method not allowed' },
    { 
      status: 405,
      headers: getSecurityHeaders()
    }
  );
}

export async function DELETE() {
  return NextResponse.json(
    { error: 'Method not allowed' },
    { 
      status: 405,
      headers: getSecurityHeaders()
    }
  );
}

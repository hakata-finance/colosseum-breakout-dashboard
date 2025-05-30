import { Project } from '@/types/project';

/**
 * Sanitize user input to prevent XSS and other security issues
 */
export function sanitizeString(input: string | null | undefined): string {
  if (!input) return '';
  
  return input
    .replace(/[<>]/g, '') // Remove potential XSS vectors
    .replace(/javascript:/gi, '') // Remove javascript: protocols
    .replace(/data:/gi, '') // Remove data: protocols
    .slice(0, 1000) // Limit length
    .trim();
}

/**
 * Sanitize search query specifically
 */
export function sanitizeSearchQuery(query: string): string {
  if (!query) return '';
  
  return query
    .replace(/[<>]/g, '') // Remove potential XSS
    .replace(/[^\w\s\-_.]/g, '') // Only allow word characters, spaces, hyphens, underscores, dots
    .slice(0, 200) // Limit search query length
    .trim();
}

/**
 * Validate and sanitize project data
 */
export function validateProject(data: any): Project | null {
  try {
    // Basic validation
    if (!data || typeof data !== 'object') {
      return null;
    }

    if (!data.id || typeof data.id !== 'number') {
      return null;
    }

    if (!data.name || typeof data.name !== 'string') {
      return null;
    }

    // Sanitize and validate project
    const project: Project = {
      id: Math.max(0, Math.floor(data.id)),
      name: sanitizeString(data.name),
      slug: sanitizeString(data.slug) || `project-${data.id}`,
      description: sanitizeString(data.description),
      repoLink: validateUrl(data.repoLink),
      country: sanitizeString(data.country),
      presentationLink: validateUrl(data.presentationLink),
      technicalDemoLink: validateUrl(data.technicalDemoLink),
      twitterHandle: sanitizeTwitterHandle(data.twitterHandle),
      additionalInfo: sanitizeString(data.additionalInfo),
      ownerId: Math.max(0, Math.floor(data.ownerId || 0)),
      submittedAt: validateDate(data.submittedAt),
      hackathonId: Math.max(0, Math.floor(data.hackathonId || 0)),
      isUniversityProject: Boolean(data.isUniversityProject),
      universityName: sanitizeString(data.universityName),
      teamSize: data.teamMembers ? data.teamMembers.length : 1,
      teamMembers: validateTeamMembers(data.teamMembers) || [],
      likes: Math.max(0, Math.floor(data.likes || 0)),
      comments: Math.max(0, Math.floor(data.comments || 0)),
      image: validateImage(data.image),
      tracks: validateTracks(data.tracks) || [],
      prize: data.prize || null,
      randomOrder: sanitizeString(data.randomOrder) || '0',
    };

    return project;
  } catch (error) {
    console.error('Error validating project:', error);
    return null;
  }
}

/**
 * Validate URL and ensure it's safe
 */
function validateUrl(url: string | null | undefined): string {
  if (!url || typeof url !== 'string') return '';
  
  try {
    const sanitized = sanitizeString(url);
    
    // Check if it's a valid URL
    const urlObj = new URL(sanitized);
    
    // Only allow http and https protocols
    if (!['http:', 'https:'].includes(urlObj.protocol)) {
      return '';
    }
    
    return sanitized;
  } catch {
    return '';
  }
}

/**
 * Validate and sanitize Twitter handle
 */
function sanitizeTwitterHandle(handle: string | null | undefined): string {
  if (!handle || typeof handle !== 'string') return '';
  
  return handle
    .replace(/[^a-zA-Z0-9_]/g, '') // Only allow alphanumeric and underscore
    .replace(/^@+/, '') // Remove leading @ symbols
    .slice(0, 15) // Twitter handle max length
    .trim();
}

/**
 * Validate date string
 */
function validateDate(dateStr: string | null | undefined): string {
  if (!dateStr || typeof dateStr !== 'string') {
    return new Date().toISOString();
  }
  
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) {
      return new Date().toISOString();
    }
    return date.toISOString();
  } catch {
    return new Date().toISOString();
  }
}

/**
 * Validate team members array
 */
function validateTeamMembers(members: any[] | null | undefined): any[] {
  if (!Array.isArray(members)) return [];
  
  return members
    .filter(member => member && typeof member === 'object')
    .map(member => ({
      id: Math.max(0, Math.floor(member.id || 0)),
      username: sanitizeString(member.username),
      aboutYou: sanitizeString(member.aboutYou),
      displayName: sanitizeString(member.displayName),
      avatarUrl: validateUrl(member.avatarUrl),
      isEditor: Boolean(member.isEditor),
    }))
    .slice(0, 20); // Limit team size
}

/**
 * Validate tracks array
 */
function validateTracks(tracks: any[] | null | undefined): string[] {
  if (!Array.isArray(tracks)) return [];
  
  return tracks
    .filter(track => track && typeof track === 'string')
    .map(track => sanitizeString(track))
    .filter(track => track.length > 0)
    .slice(0, 10); // Limit number of tracks
}

/**
 * Validate image object
 */
function validateImage(image: any | null | undefined): any {
  if (!image || typeof image !== 'object') {
    return {
      id: 0,
      name: '',
      url: '',
      mimetype: '',
      size: 0,
      uid: '',
    };
  }
  
  return {
    id: Math.max(0, Math.floor(image.id || 0)),
    name: sanitizeString(image.name),
    url: validateUrl(image.url),
    mimetype: sanitizeString(image.mimetype),
    size: Math.max(0, Math.floor(image.size || 0)),
    uid: sanitizeString(image.uid),
  };
}

/**
 * Validate an array of projects
 */
export function validateProjects(data: any[]): Project[] {
  if (!Array.isArray(data)) {
    console.error('Projects data is not an array');
    return [];
  }
  
  const validProjects: Project[] = [];
  
  for (const item of data) {
    const validProject = validateProject(item);
    if (validProject) {
      validProjects.push(validProject);
    }
  }
  
  console.log(`Validated ${validProjects.length} out of ${data.length} projects`);
  return validProjects;
}

/**
 * Rate limiting helper for API calls
 */
export class RateLimiter {
  private calls: number[] = [];
  private maxCalls: number;
  private windowMs: number;

  constructor(maxCalls: number = 10, windowMs: number = 60000) {
    this.maxCalls = maxCalls;
    this.windowMs = windowMs;
  }

  canMakeRequest(): boolean {
    const now = Date.now();
    
    // Remove old calls outside the window
    this.calls = this.calls.filter(time => now - time < this.windowMs);
    
    // Check if we can make a new call
    if (this.calls.length < this.maxCalls) {
      this.calls.push(now);
      return true;
    }
    
    return false;
  }

  getTimeUntilReset(): number {
    if (this.calls.length < this.maxCalls) return 0;
    
    const oldestCall = Math.min(...this.calls);
    const timeUntilReset = this.windowMs - (Date.now() - oldestCall);
    
    return Math.max(0, timeUntilReset);
  }
}

// Global rate limiter instance
export const apiRateLimiter = new RateLimiter(10, 60000); // 10 calls per minute

/**
 * Security headers for API responses
 */
export function getSecurityHeaders(): Record<string, string> {
  return {
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:;",
  };
}

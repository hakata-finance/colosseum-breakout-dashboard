import { Project } from '@/types/project';

export async function fetchProjectsFromAPI(): Promise<Project[]> {
  try {
    const response = await fetch('/api/projects');
    
    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}: ${response.statusText}`);
    }
    
    const projects = await response.json();
    
    if (!projects || projects.length === 0) {
      throw new Error('No projects found in API response');
    }
    
    return projects;
  } catch (error) {
    console.error('Failed to fetch from API:', error);
    throw error;
  }
}

export function exportToCSV(projects: Project[], filename: string = 'colosseum_projects.csv'): void {
  const headers = [
    'Rank', 'Name', 'Likes', 'Comments', 'Tracks', 'Country', 
    'Twitter Handle', 'Followers', 'Following', 'Arena URL'
  ];
  
  const rows = projects.map((project, index) => [
    index + 1,
    `"${project.name || ''}"`,
    project.likes || 0,
    project.comments || 0,
    `"${project.tracks ? project.tracks.join(', ') : ''}"`,
    `"${project.country || ''}"`,
    `"${project.twitterHandle || ''}"`,
    project.twitterFollowers || 0,
    project.twitterFollowing || 0,
    `"https://arena.colosseum.org/projects/explore/${project.slug}"`
  ]);
  
  const csv = [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
  
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  window.URL.revokeObjectURL(url);
}

export function exportToJSON(projects: Project[], filename: string = 'colosseum_projects.json'): void {
  const exportData = {
    exported_at: new Date().toISOString(),
    total_projects: projects.length,
    projects: projects.map((project, index) => ({
      rank: index + 1,
      ...project,
      arena_url: `https://arena.colosseum.org/projects/explore/${project.slug}`
    }))
  };
  
  const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  window.URL.revokeObjectURL(url);
} 
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
    'Rank', 'ID', 'Name', 'Slug', 'Description', 'Repository Link', 'Country', 
    'Presentation Link', 'Technical Demo Link', 'Twitter Handle', 'Twitter Followers', 
    'Twitter Following', 'Additional Info', 'Owner ID', 'Submitted At', 'Hackathon ID',
    'Is University Project', 'University Name', 'Team Size', 'Likes', 'Comments',
    'Tracks', 'Prize', 'Random Order', 'Image URL', 'Image Name', 'Image Size',
    'Team Members', 'Arena URL', 'Created At', 'Updated At', 'GitHub URL'
  ];
  
  const rows = projects.map((project, index) => [
    index + 1,
    project.id,
    `"${project.name || ''}"`,
    `"${project.slug || ''}"`,
    `"${(project.description || '').replace(/"/g, '""')}"`,
    `"${project.repoLink || ''}"`,
    `"${project.country || ''}"`,
    `"${project.presentationLink || ''}"`,
    `"${project.technicalDemoLink || ''}"`,
    `"${project.twitterHandle || ''}"`,
    project.twitterFollowers || 0,
    project.twitterFollowing || 0,
    `"${(project.additionalInfo || '').replace(/"/g, '""')}"`,
    project.ownerId || 0,
    `"${project.submittedAt || ''}"`,
    project.hackathonId || 0,
    project.isUniversityProject ? 'Yes' : 'No',
    `"${project.universityName || ''}"`,
    project.teamSize || project.teamMembers?.length || 1,
    project.likes || 0,
    project.comments || 0,
    `"${project.tracks ? project.tracks.join(', ') : ''}"`,
    `"${project.prize ? JSON.stringify(project.prize).replace(/"/g, '""') : ''}"`,
    `"${project.randomOrder || ''}"`,
    `"${project.image?.url || ''}"`,
    `"${project.image?.name || ''}"`,
    project.image?.size || 0,
    `"${project.teamMembers ? project.teamMembers.map(m => `${m.displayName} (${m.username})`).join('; ') : ''}"`,
    `"https://arena.colosseum.org/projects/explore/${project.slug}"`,
    `"${project.createdAt || ''}"`,
    `"${project.updatedAt || ''}"`,
    `"${project.github_url || ''}"`
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

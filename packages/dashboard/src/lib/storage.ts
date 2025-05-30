import { Project } from '@/types/project';

const STORAGE_KEY = 'colosseum_projects';
const LAST_FETCH_KEY = 'colosseum_last_fetch';

export function saveProjects(projects: Project[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
    localStorage.setItem(LAST_FETCH_KEY, new Date().toISOString());
  } catch (error) {
    console.error('Failed to save projects to localStorage:', error);
  }
}

export function loadProjects(): Project[] {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Failed to load projects from localStorage:', error);
    return [];
  }
}

export function getLastFetchTime(): Date | null {
  try {
    const timestamp = localStorage.getItem(LAST_FETCH_KEY);
    return timestamp ? new Date(timestamp) : null;
  } catch (error) {
    console.error('Failed to get last fetch time:', error);
    return null;
  }
}

export function clearProjects(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(LAST_FETCH_KEY);
  } catch (error) {
    console.error('Failed to clear projects from localStorage:', error);
  }
} 
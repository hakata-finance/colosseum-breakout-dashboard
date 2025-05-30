'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Project } from '@/types/project';
import { loadProjects, saveProjects, getLastFetchTime } from '@/lib/storage';
import { fetchProjectsFromAPI } from '@/lib/api';
import { validateProjects } from '@/lib/validation';

interface ProjectsContextType {
  projects: Project[];
  loading: boolean;
  lastFetch: Date | null;
  error: string | null;
  fetchData: () => Promise<void>;
  clearError: () => void;
}

const ProjectsContext = createContext<ProjectsContextType | null>(null);

export function ProjectsProvider({ children }: { children: ReactNode }) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(false);
  const [lastFetch, setLastFetch] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Load data on mount
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        const savedProjects = loadProjects();
        const lastFetchTime = getLastFetchTime();
        
        if (savedProjects.length > 0) {
          const validatedProjects = validateProjects(savedProjects);
          setProjects(validatedProjects);
          setLastFetch(lastFetchTime);
        }
      } catch (error) {
        console.error('Failed to load initial data:', error);
        setError('Failed to load saved data');
      }
    };

    loadInitialData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const newProjects = await fetchProjectsFromAPI();
      const validatedProjects = validateProjects(newProjects);
      
      if (validatedProjects.length === 0) {
        throw new Error('No valid projects received from API');
      }
      
      setProjects(validatedProjects);
      saveProjects(validatedProjects);
      setLastFetch(new Date());
      
      console.log(`Successfully loaded ${validatedProjects.length} projects`);
    } catch (error) {
      console.error('Failed to fetch projects:', error);
      setError(error instanceof Error ? error.message : 'Failed to fetch projects');
    } finally {
      setLoading(false);
    }
  };

  const clearError = () => setError(null);

  return (
    <ProjectsContext.Provider value={{
      projects,
      loading,
      lastFetch,
      error,
      fetchData,
      clearError
    }}>
      {children}
    </ProjectsContext.Provider>
  );
}

export function useProjects() {
  const context = useContext(ProjectsContext);
  if (!context) {
    throw new Error('useProjects must be used within a ProjectsProvider');
  }
  return context;
}

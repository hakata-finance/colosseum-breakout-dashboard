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
  isRefreshing: boolean;
  refreshCount: number;
}

const ProjectsContext = createContext<ProjectsContextType | null>(null);

const STALE_TIME = 60 * 1000; // 1 minute - auto-refresh if data is older

export function ProjectsProvider({ children }: { children: ReactNode }) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(false);
  const [lastFetch, setLastFetch] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [initialLoaded, setInitialLoaded] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [refreshCount, setRefreshCount] = useState(0);

  const fetchData = async (isBackground = false) => {
    if (!isBackground) {
      setLoading(true);
      setIsRefreshing(true);
    }
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
      setRefreshCount(prev => prev + 1);
      
      console.log(`Successfully loaded ${validatedProjects.length} projects`);
    } catch (error) {
      console.error('Failed to fetch projects:', error);
      setError(error instanceof Error ? error.message : 'Failed to fetch projects');
    } finally {
      if (!isBackground) {
        setLoading(false);
        setIsRefreshing(false);
      }
    }
  };

  // Load data on mount with auto-fetch logic
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        const savedProjects = loadProjects();
        const lastFetchTime = getLastFetchTime();
        
        // Check if we have saved data and it's not too old
        const hasValidSavedData = savedProjects.length > 0 && lastFetchTime;
        const dataAge = lastFetchTime ? Date.now() - lastFetchTime.getTime() : Infinity;
        const isStale = dataAge > STALE_TIME;
        
        if (hasValidSavedData) {
          // Load saved data immediately
          const validatedProjects = validateProjects(savedProjects);
          setProjects(validatedProjects);
          setLastFetch(lastFetchTime);
          console.log(`Loaded ${validatedProjects.length} cached projects (${Math.floor(dataAge / 1000)}s old)`);
          
          // If data is stale, refresh in background
          if (isStale) {
            console.log('Data is stale, refreshing in background...');
            fetchData(true); // Background refresh
          }
        } else {
          // No saved data or invalid data - fetch fresh
          console.log('No cached data found, fetching fresh...');
          await fetchData();
        }
      } catch (error) {
        console.error('Failed to load initial data:', error);
        setError('Failed to load saved data');
        // Try to fetch fresh data as fallback
        await fetchData();
      } finally {
        setInitialLoaded(true);
      }
    };

    loadInitialData();
  }, []);

  // Set up periodic refresh when data gets stale
  useEffect(() => {
    if (!lastFetch || !initialLoaded) return;
    
    const checkForRefresh = () => {
      const dataAge = Date.now() - lastFetch.getTime();
      if (dataAge > STALE_TIME) {
        console.log('Data became stale, refreshing in background...');
        fetchData(true);
      }
    };
    
    // Check every 30 seconds if we need to refresh
    const interval = setInterval(checkForRefresh, 30000);
    
    return () => clearInterval(interval);
  }, [lastFetch, initialLoaded]);

  const clearError = () => setError(null);

  return (
    <ProjectsContext.Provider value={{
      projects,
      loading,
      lastFetch,
      error,
      fetchData: () => fetchData(false),
      clearError,
      isRefreshing,
      refreshCount
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

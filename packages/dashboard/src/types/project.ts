export interface TeamMember {
  id: number;
  username: string;
  aboutYou: string;
  displayName: string;
  avatarUrl: string;
  isEditor: boolean;
}

export interface ProjectImage {
  id: number;
  name: string;
  url: string;
  mimetype: string;
  size: number;
  uid: string;
}

export interface Project {
  id: number;
  name: string;
  slug: string;
  description: string;
  repoLink: string;
  country: string;
  presentationLink: string;
  technicalDemoLink: string;
  twitterHandle: string;
  additionalInfo: string | null;
  ownerId: number;
  submittedAt: string; // ISO date string
  hackathonId: number;
  isUniversityProject: boolean;
  universityName: string | null;
  teamSize?: number; // This will be calculated from teamMembers.length
  teamMembers: TeamMember[];
  likes: number;
  comments: number;
  image: ProjectImage;
  tracks: string[];
  prize: unknown | null; // Type unclear from sample, adjust as needed
  randomOrder: string;
  // Legacy fields for backward compatibility
  twitterUserId?: string;
  twitterFollowers?: number;
  twitterFollowing?: number;
  createdAt?: string;
  updatedAt?: string;
  github_url?: string;
}

export interface ColosseumProjectsResponse {
  projects: Project[];
}

export interface ProjectMetrics {
  totalProjects: number;
  totalLikes: number;
  totalComments: number;
  avgLikes: number;
  avgComments: number;
  projectsWithLikes: number;
  projectsWithComments: number;
}

export interface FilterOptions {
  search: string;
  tracks: string[];
  countries: string[];
  teamSizeRange: [number, number];
  likesRange: [number, number];
  sortBy: 'likes' | 'comments' | 'name' | 'country' | 'teamSize';
  sortOrder: 'asc' | 'desc';
} 
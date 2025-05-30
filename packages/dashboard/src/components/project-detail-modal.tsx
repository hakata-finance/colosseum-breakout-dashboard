'use client';

import { useState } from 'react';
import { Project } from '@/types/project';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Github,
  ExternalLink,
  Play,
  Heart,
  MessageSquare,
  Users,
  MapPin,
  Calendar,
  Award,
  Link as LinkIcon,
  Copy,
  Check,
  Twitter,
} from 'lucide-react';
import { formatNumber, truncate } from '@/lib/utils';

interface ProjectDetailModalProps {
  project: Project | null;
  isOpen: boolean;
  onClose: () => void;
}

export function ProjectDetailModal({ 
  project, 
  isOpen, 
  onClose 
}: ProjectDetailModalProps) {
  const [copiedUrl, setCopiedUrl] = useState(false);

  if (!project) return null;

  const projectUrl = `https://colosseum.org/projects/${project.slug}`;

  const handleCopyUrl = async () => {
    try {
      await navigator.clipboard.writeText(projectUrl);
      setCopiedUrl(true);
      setTimeout(() => setCopiedUrl(false), 2000);
    } catch (error) {
      console.error('Failed to copy URL:', error);
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: project.name,
          text: project.description || 'Check out this project from Colosseum!',
          url: projectUrl,
        });
      } catch (error) {
        // User cancelled sharing
      }
    } else {
      handleCopyUrl();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            {project.name}
            {project.isUniversityProject && (
              <Badge variant="secondary" className="gap-1">
                <Award className="h-3 w-3" />
                University
              </Badge>
            )}
          </DialogTitle>
        </DialogHeader>
        
        <div className="grid gap-6 md:grid-cols-3">
          {/* Left Column - Media & Links */}
          <div className="space-y-4">
            {/* Project Image */}
            {project.image?.url && (
              <Card>
                <CardContent className="p-3">
                  <img
                    src={project.image.url}
                    alt={project.name}
                    className="w-full aspect-video object-cover rounded-lg"
                    onError={(e) => {
                      e.currentTarget.src = '/api/placeholder/400/225';
                    }}
                  />
                </CardContent>
              </Card>
            )}

            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-2">
              {project.repoLink && (
                <Button asChild variant="outline" size="sm">
                  <a href={project.repoLink} target="_blank" rel="noopener noreferrer">
                    <Github className="mr-2 h-4 w-4" />
                    Code
                  </a>
                </Button>
              )}
              
              {project.presentationLink && (
                <Button asChild variant="outline" size="sm">
                  <a href={project.presentationLink} target="_blank" rel="noopener noreferrer">
                    <Play className="mr-2 h-4 w-4" />
                    Demo
                  </a>
                </Button>
              )}
              
              {project.technicalDemoLink && (
                <Button asChild variant="outline" size="sm">
                  <a href={project.technicalDemoLink} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="mr-2 h-4 w-4" />
                    Tech Demo
                  </a>
                </Button>
              )}

              <Button asChild variant="outline" size="sm">
                <a href={projectUrl} target="_blank" rel="noopener noreferrer">
                  <LinkIcon className="mr-2 h-4 w-4" />
                  View Page
                </a>
              </Button>

              <Button onClick={handleShare} variant="outline" size="sm" className="col-span-2">
                {copiedUrl ? (
                  <>
                    <Check className="mr-2 h-4 w-4 text-green-500" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="mr-2 h-4 w-4" />
                    Share Project
                  </>
                )}
              </Button>
            </div>

            {/* Engagement Metrics */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Engagement</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-4">
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1 text-sm text-muted-foreground">
                    <Heart className="h-4 w-4 text-red-500" />
                    Likes
                  </div>
                  <div className="text-lg font-bold">{formatNumber(project.likes || 0)}</div>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1 text-sm text-muted-foreground">
                    <MessageSquare className="h-4 w-4 text-blue-500" />
                    Comments
                  </div>
                  <div className="text-lg font-bold">{formatNumber(project.comments || 0)}</div>
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* Right Column - Details */}
          <div className="md:col-span-2 space-y-4">
            {/* Description */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">About This Project</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm leading-relaxed whitespace-pre-wrap">
                  {project.description || 'No description provided.'}
                </p>
              </CardContent>
            </Card>

            {/* Additional Info */}
            {project.additionalInfo && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Additional Information</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">
                    {project.additionalInfo}
                  </p>
                </CardContent>
              </Card>
            )}
            
            {/* Team & Meta Information */}
            <div className="grid gap-4 md:grid-cols-2">
              {/* Team */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Team ({project.teamMembers?.length || 1})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {project.teamMembers && project.teamMembers.length > 0 ? (
                    <div className="space-y-2">
                      {project.teamMembers.map(member => (
                        <div key={member.id} className="flex items-center gap-2">
                          {member.avatarUrl && (
                            <img
                              src={member.avatarUrl}
                              alt={member.displayName}
                              className="w-6 h-6 rounded-full"
                              onError={(e) => {
                                e.currentTarget.style.display = 'none';
                              }}
                            />
                          )}
                          <div>
                            <div className="text-sm font-medium">{member.displayName}</div>
                            {member.aboutYou && (
                              <div className="text-xs text-muted-foreground">
                                {truncate(member.aboutYou, 60)}
                              </div>
                            )}
                          </div>
                          {member.isEditor && (
                            <Badge variant="outline" className="text-xs">
                              Editor
                            </Badge>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">Solo project</p>
                  )}
                </CardContent>
              </Card>

              {/* Project Details */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Project Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {/* Tracks */}
                  <div>
                    <div className="text-sm font-medium mb-1">Tracks</div>
                    <div className="flex flex-wrap gap-1">
                      {project.tracks && project.tracks.length > 0 ? (
                        project.tracks.map((track, i) => (
                          <Badge key={i} variant="secondary" className="text-xs">
                            {track}
                          </Badge>
                        ))
                      ) : (
                        <span className="text-xs text-muted-foreground">No tracks specified</span>
                      )}
                    </div>
                  </div>

                  {/* Country */}
                  {project.country && (
                    <div>
                      <div className="text-sm font-medium mb-1">Location</div>
                      <div className="flex items-center gap-1 text-sm">
                        <MapPin className="h-3 w-3" />
                        {project.country}
                      </div>
                    </div>
                  )}

                  {/* University */}
                  {project.universityName && (
                    <div>
                      <div className="text-sm font-medium mb-1">University</div>
                      <div className="text-sm">{project.universityName}</div>
                    </div>
                  )}

                  {/* Twitter */}
                  {project.twitterHandle && (
                    <div>
                      <div className="text-sm font-medium mb-1">Twitter</div>
                      <Button
                        asChild
                        variant="outline"
                        size="sm"
                        className="h-7 px-2"
                      >
                        <a
                          href={`https://twitter.com/${project.twitterHandle}`}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <Twitter className="mr-1 h-3 w-3" />
                          @{project.twitterHandle}
                        </a>
                      </Button>
                    </div>
                  )}

                  {/* Submission Date */}
                  {project.submittedAt && (
                    <div>
                      <div className="text-sm font-medium mb-1">Submitted</div>
                      <div className="flex items-center gap-1 text-sm">
                        <Calendar className="h-3 w-3" />
                        {new Date(project.submittedAt).toLocaleDateString()}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Hook to manage modal state
export function useProjectModal() {
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  const openModal = (project: Project) => {
    setSelectedProject(project);
    setIsOpen(true);
  };

  const closeModal = () => {
    setIsOpen(false);
    setTimeout(() => setSelectedProject(null), 200); // Allow animation to complete
  };

  return {
    selectedProject,
    isOpen,
    openModal,
    closeModal,
  };
}

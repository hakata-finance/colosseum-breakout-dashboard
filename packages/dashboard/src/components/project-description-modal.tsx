'use client';

import { useState, useMemo, memo } from 'react';
import { Button } from '@/components/ui/button';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog';
import { Project } from '@/types/project';
import { ExternalLink, Users, Heart, MessageSquare, MapPin, Calendar, Github, Presentation, Code, ChevronDown, ChevronUp } from 'lucide-react';
import { formatNumber } from '@/lib/utils';
import Link from 'next/link';

interface ProjectDescriptionModalProps {
  project: Project;
  isOpen: boolean;
  onClose: () => void;
}

// Memoized stat card component
const StatCard = memo(({ icon, value, label, color }: {
  icon: React.ReactNode;
  value: string | number;
  label: string;
  color: string;
}) => (
  <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-muted/40 to-muted/60 rounded-xl border border-muted-foreground/10 hover:shadow-sm transition-all duration-200">
    <div className={`p-2 rounded-lg ${color}`}>
      {icon}
    </div>
    <div>
      <div className="font-bold text-lg">{value}</div>
      <div className="text-xs text-muted-foreground font-medium">{label}</div>
    </div>
  </div>
));
StatCard.displayName = 'StatCard';

// Memoized team member component
const TeamMember = memo(({ member }: { member: any }) => (
  <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-muted/30 to-muted/50 rounded-lg border border-muted-foreground/10 hover:shadow-sm transition-all duration-200">
    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-md">
      {member.displayName?.charAt(0) || member.username?.charAt(0) || '?'}
    </div>
    <div className="flex-1 min-w-0">
      <div className="font-semibold text-sm">{member.displayName || member.username}</div>
      {member.username && member.displayName && (
        <div className="text-xs text-muted-foreground">@{member.username}</div>
      )}
      {member.isEditor && (
        <div className="text-xs text-blue-600 dark:text-blue-400 font-medium">Editor</div>
      )}
    </div>
  </div>
));
TeamMember.displayName = 'TeamMember';

// Memoized link component
const ProjectLink = memo(({ href, icon, label }: {
  href: string;
  icon: React.ReactNode;
  label: string;
}) => (
  <Link
    href={href}
    target="_blank"
    className="flex items-center gap-3 p-3 hover:bg-muted/50 rounded-lg transition-all duration-200 border border-transparent hover:border-muted-foreground/20 group"
  >
    <div className="p-1.5 rounded-md bg-muted/50 group-hover:bg-muted transition-colors">
      {icon}
    </div>
    <span className="text-sm font-medium">{label}</span>
    <ExternalLink className="h-3 w-3 ml-auto opacity-50 group-hover:opacity-100 transition-opacity" />
  </Link>
));
ProjectLink.displayName = 'ProjectLink';

export function ProjectDescriptionModal({ project, isOpen, onClose }: ProjectDescriptionModalProps) {
  const [expandedSections, setExpandedSections] = useState({
    description: true,
    team: false,
    links: false,
    additional: false
  });

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  // Memoize expensive calculations
  const stats = useMemo(() => {
    const teamSize = project.teamMembers?.length || 1;
    return {
      likes: project.likes || 0,
      comments: project.comments || 0,
      teamSize,
      country: project.country
    };
  }, [project.likes, project.comments, project.teamMembers?.length, project.country]);

  const hasLinks = useMemo(() => 
    !!(project.repoLink || project.presentationLink || project.technicalDemoLink || project.twitterHandle),
    [project.repoLink, project.presentationLink, project.technicalDemoLink, project.twitterHandle]
  );

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader className="shrink-0 border-b pb-4">
          <DialogTitle className="flex items-center gap-3 text-xl">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center text-white font-bold text-sm">
              {project.name?.charAt(0) || 'P'}
            </div>
            <span className="flex-1 truncate">{project.name}</span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.open(`https://arena.colosseum.org/projects/explore/${project.slug}`, '_blank')}
              className="shrink-0"
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              Arena
            </Button>
          </DialogTitle>
        </DialogHeader>
        
        <div className="flex-1 overflow-y-auto space-y-6 py-6">
          {/* Quick Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              icon={<Heart className="h-4 w-4 text-white" />}
              value={formatNumber(stats.likes)}
              label="Likes"
              color="bg-red-500"
            />
            <StatCard
              icon={<MessageSquare className="h-4 w-4 text-white" />}
              value={formatNumber(stats.comments)}
              label="Comments"
              color="bg-blue-500"
            />
            <StatCard
              icon={<Users className="h-4 w-4 text-white" />}
              value={stats.teamSize}
              label={stats.teamSize === 1 ? 'Member' : 'Members'}
              color="bg-green-500"
            />
            {stats.country && (
              <StatCard
                icon={<MapPin className="h-4 w-4 text-white" />}
                value={stats.country}
                label="Country"
                color="bg-purple-500"
              />
            )}
          </div>

          {/* Tracks */}
          {project.tracks && project.tracks.length > 0 && (
            <div>
              <div className="flex flex-wrap gap-2">
                {project.tracks.map((track, i) => (
                  <span
                    key={i}
                    className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium bg-gradient-to-r from-hakata-purple/10 to-hakata-purple/20 text-hakata-purple dark:from-hakata-purple/20 dark:to-hakata-purple/30 dark:text-hakata-light-purple border border-hakata-purple/20 dark:border-hakata-purple/30"
                  >
                    {track}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Description Section */}
          <div className="space-y-3">
            <button
              onClick={() => toggleSection('description')}
              className="flex items-center gap-2 w-full text-left hover:text-foreground transition-colors"
            >
              <h3 className="font-bold text-base">Project Description</h3>
              {expandedSections.description ? 
                <ChevronUp className="h-4 w-4" /> : 
                <ChevronDown className="h-4 w-4" />
              }
            </button>
            {expandedSections.description && (
              <div className="p-4 bg-muted/30 rounded-xl border border-muted-foreground/10">
                <p className="text-sm leading-relaxed">
                  {project.description?.trim() || 'No description provided.'}
                </p>
              </div>
            )}
          </div>

          {/* Team Section */}
          {project.teamMembers && project.teamMembers.length > 0 && (
            <div className="space-y-3">
              <button
                onClick={() => toggleSection('team')}
                className="flex items-center gap-2 w-full text-left hover:text-foreground transition-colors"
              >
                <h3 className="font-bold text-base">Team ({project.teamMembers.length})</h3>
                {expandedSections.team ? 
                  <ChevronUp className="h-4 w-4" /> : 
                  <ChevronDown className="h-4 w-4" />
                }
              </button>
              {expandedSections.team && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {project.teamMembers.slice(0, 8).map((member, i) => (
                    <TeamMember key={i} member={member} />
                  ))}
                  {project.teamMembers.length > 8 && (
                    <div className="md:col-span-2 text-center text-sm text-muted-foreground">
                      ... and {project.teamMembers.length - 8} more members
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Links Section */}
          {hasLinks && (
            <div className="space-y-3">
              <button
                onClick={() => toggleSection('links')}
                className="flex items-center gap-2 w-full text-left hover:text-foreground transition-colors"
              >
                <h3 className="font-bold text-base">Links</h3>
                {expandedSections.links ? 
                  <ChevronUp className="h-4 w-4" /> : 
                  <ChevronDown className="h-4 w-4" />
                }
              </button>
              {expandedSections.links && (
                <div className="space-y-2">
                  {project.repoLink && (
                    <ProjectLink
                      href={project.repoLink}
                      icon={<Github className="h-4 w-4" />}
                      label="Repository"
                    />
                  )}
                  {project.presentationLink && (
                    <ProjectLink
                      href={project.presentationLink}
                      icon={<Presentation className="h-4 w-4" />}
                      label="Presentation"
                    />
                  )}
                  {project.technicalDemoLink && (
                    <ProjectLink
                      href={project.technicalDemoLink}
                      icon={<Code className="h-4 w-4" />}
                      label="Technical Demo"
                    />
                  )}
                  {project.twitterHandle && (
                    <ProjectLink
                      href={`https://x.com/${project.twitterHandle}`}
                      icon={
                        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                        </svg>
                      }
                      label={`@${project.twitterHandle}`}
                    />
                  )}
                </div>
              )}
            </div>
          )}

          {/* Additional Info */}
          {project.additionalInfo && (
            <div className="space-y-3">
              <button
                onClick={() => toggleSection('additional')}
                className="flex items-center gap-2 w-full text-left hover:text-foreground transition-colors"
              >
                <h3 className="font-bold text-base">Additional Information</h3>
                {expandedSections.additional ? 
                  <ChevronUp className="h-4 w-4" /> : 
                  <ChevronDown className="h-4 w-4" />
                }
              </button>
              {expandedSections.additional && (
                <div className="p-4 bg-muted/30 rounded-xl border border-muted-foreground/10">
                  <p className="text-sm leading-relaxed">
                    {project.additionalInfo}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* University Badge */}
          {project.isUniversityProject && project.universityName && (
            <div className="p-4 bg-gradient-to-r from-amber-50 to-amber-100 dark:from-amber-950/20 dark:to-amber-900/30 border border-amber-200 dark:border-amber-800 rounded-xl">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-amber-500 rounded-lg">
                  <Calendar className="h-4 w-4 text-white" />
                </div>
                <div>
                  <span className="text-sm font-bold text-amber-900 dark:text-amber-100">University Project</span>
                  <p className="text-xs text-amber-700 dark:text-amber-300 font-medium">
                    {project.universityName}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

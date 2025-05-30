'use client';

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Project, ProjectMetrics } from "@/types/project";
import { formatNumber, formatPercentage } from "@/lib/utils";
import { TrendingUp, Users, MessageSquare, Heart } from "lucide-react";

interface OverviewCardsProps {
  projects: Project[];
}

export function OverviewCards({ projects }: OverviewCardsProps) {
  const metrics: ProjectMetrics = {
    totalProjects: projects.length,
    totalLikes: projects.reduce((sum, p) => sum + (p.likes || 0), 0),
    totalComments: projects.reduce((sum, p) => sum + (p.comments || 0), 0),
    avgLikes: projects.length > 0 ? projects.reduce((sum, p) => sum + (p.likes || 0), 0) / projects.length : 0,
    avgComments: projects.length > 0 ? projects.reduce((sum, p) => sum + (p.comments || 0), 0) / projects.length : 0,
    projectsWithLikes: projects.filter(p => (p.likes || 0) > 0).length,
    projectsWithComments: projects.filter(p => (p.comments || 0) > 0).length,
  };

  const cards = [
    {
      title: "Total Projects",
      value: formatNumber(metrics.totalProjects),
      icon: Users,
      description: "Projects in hackathon",
    },
    {
      title: "Total Likes",
      value: formatNumber(metrics.totalLikes),
      icon: Heart,
      description: `Avg: ${metrics.avgLikes.toFixed(1)} per project`,
    },
    {
      title: "Total Comments",
      value: formatNumber(metrics.totalComments),
      icon: MessageSquare,
      description: `Avg: ${metrics.avgComments.toFixed(1)} per project`,
    },
    {
      title: "Engagement Rate",
      value: formatPercentage((metrics.projectsWithLikes / metrics.totalProjects) * 100),
      icon: TrendingUp,
      description: "Projects with likes",
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {cards.map((card, index) => {
        const Icon = card.icon;
        return (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {card.title}
              </CardTitle>
              <Icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{card.value}</div>
              <p className="text-xs text-muted-foreground">
                {card.description}
              </p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
} 
'use client';

import { Card, CardContent } from "@/components/ui/card";
import { Project, ProjectMetrics } from "@/types/project";
import { formatNumber } from "@/lib/utils";
import { Users, MessageSquare, Heart } from "lucide-react";

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
      label: "Projects",
      value: formatNumber(metrics.totalProjects),
      icon: Users,
      color: "text-blue-600 dark:text-blue-400",
    },
    {
      label: "Likes",
      value: formatNumber(metrics.totalLikes),
      icon: Heart,
      color: "text-red-500 dark:text-red-400",
    },
    {
      label: "Comments",
      value: formatNumber(metrics.totalComments),
      icon: MessageSquare,
      color: "text-green-600 dark:text-green-400",
    },
  ];

  return (
    <div className="grid grid-cols-3 gap-3">
      {cards.map((card, index) => {
        const Icon = card.icon;
        return (
          <Card key={index} className="border-0 bg-muted/30">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    {card.label}
                  </p>
                  <p className="text-lg font-bold mt-1">{card.value}</p>
                </div>
                <Icon className={`h-5 w-5 ${card.color}`} />
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
} 
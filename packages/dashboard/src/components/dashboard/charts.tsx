'use client';

import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Project } from "@/types/project";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area } from 'recharts';

interface ChartsProps {
  projects: Project[];
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D', '#FFC658', '#FF7C7C'];

export function Charts({ projects }: ChartsProps) {
  const chartData = useMemo(() => {
    // Top countries
    const countryStats = projects.reduce((acc, p) => {
      const country = p.country || 'Unknown';
      acc[country] = (acc[country] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const topCountries = Object.entries(countryStats)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([country, count]) => ({ country, count }));

    // Track popularity
    const trackStats = projects.reduce((acc, p) => {
      p.tracks?.forEach(track => {
        acc[track] = (acc[track] || 0) + 1;
      });
      return acc;
    }, {} as Record<string, number>);

    const topTracks = Object.entries(trackStats)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 8)
      .map(([name, value]) => ({ name, value }));

    // Engagement distribution
    const engagementBuckets = [
      { range: '0-5', min: 0, max: 5 },
      { range: '6-20', min: 6, max: 20 },
      { range: '21-50', min: 21, max: 50 },
      { range: '51-100', min: 51, max: 100 },
      { range: '100+', min: 101, max: Infinity }
    ];

    const engagementData = engagementBuckets.map(bucket => {
      const count = projects.filter(p => {
        const likes = p.likes || 0;
        return likes >= bucket.min && (bucket.max === Infinity ? true : likes <= bucket.max);
      }).length;
      return { range: bucket.range, count };
    });

    // Team size distribution
    const teamSizeData = projects.reduce((acc, p) => {
      const size = p.teamMembers?.length || 1;
      const bucket = size === 1 ? '1' : 
                   size <= 3 ? '2-3' : 
                   size <= 5 ? '4-5' : 
                   size <= 8 ? '6-8' : '9+';
      acc[bucket] = (acc[bucket] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const teamSizeChartData = Object.entries(teamSizeData)
      .map(([size, count]) => ({ size, count }));

    // Top engaged projects
    const topEngaged = projects
      .sort((a, b) => ((b.likes || 0) + (b.comments || 0)) - ((a.likes || 0) + (a.comments || 0)))
      .slice(0, 15)
      .map(p => ({
        name: p.name.length > 20 ? p.name.substring(0, 20) + '...' : p.name,
        likes: p.likes || 0,
        comments: p.comments || 0,
        total: (p.likes || 0) + (p.comments || 0)
      }));

    return { topCountries, topTracks, engagementData, teamSizeChartData, topEngaged };
  }, [projects]);

  if (projects.length === 0) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3].map(i => (
          <Card key={i}>
            <CardHeader>
              <CardTitle>No Data Available</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                Load projects to see analytics
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {/* Top Countries Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Projects by Country</CardTitle>
          <p className="text-sm text-muted-foreground">Top 10 countries</p>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData.topCountries} margin={{ bottom: 80 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="country" 
                angle={-45} 
                textAnchor="end" 
                height={80}
                fontSize={12}
              />
              <YAxis />
              <Tooltip />
              <Bar dataKey="count" fill="#8884d8" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Track Popularity */}
      <Card>
        <CardHeader>
          <CardTitle>Popular Tracks</CardTitle>
          <p className="text-sm text-muted-foreground">Most common project categories</p>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={chartData.topTracks}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={100}
                label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                labelLine={false}
                fontSize={12}
              >
                {chartData.topTracks.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Engagement Distribution */}
      <Card>
        <CardHeader>
          <CardTitle>Engagement Distribution</CardTitle>
          <p className="text-sm text-muted-foreground">Projects by likes received</p>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData.engagementData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="range" />
              <YAxis />
              <Tooltip formatter={(value) => [`${value} projects`, 'Count']} />
              <Bar dataKey="count" fill="#82ca9d" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Team Size Distribution */}
      <Card>
        <CardHeader>
          <CardTitle>Team Size Distribution</CardTitle>
          <p className="text-sm text-muted-foreground">Number of team members</p>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={chartData.teamSizeChartData}
                dataKey="count"
                nameKey="size"
                cx="50%"
                cy="50%"
                outerRadius={100}
                label={({ size, percent }) => `${size} (${(percent * 100).toFixed(0)}%)`}
              >
                {chartData.teamSizeChartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Top Engaged Projects */}
      <Card className="md:col-span-2">
        <CardHeader>
          <CardTitle>Most Engaged Projects</CardTitle>
          <p className="text-sm text-muted-foreground">Top 15 by likes + comments</p>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={chartData.topEngaged} margin={{ bottom: 80 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="name" 
                angle={-45} 
                textAnchor="end" 
                height={80}
                fontSize={12}
              />
              <YAxis />
              <Tooltip 
                formatter={(value, name) => [value, name === 'total' ? 'Total Engagement' : name]}
              />
              <Area
                type="monotone"
                dataKey="likes"
                stackId="1"
                stroke="#8884d8"
                fill="#8884d8"
                name="Likes"
              />
              <Area
                type="monotone"
                dataKey="comments"
                stackId="1"
                stroke="#82ca9d"
                fill="#82ca9d"
                name="Comments"
              />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}

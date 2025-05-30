'use client';

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Project, FilterOptions } from "@/types/project";
import { getUniqueValues } from "@/lib/utils";
import { Filter, X } from "lucide-react";

interface FilterPanelProps {
  projects: Project[];
  filters: FilterOptions;
  onFiltersChange: (filters: Partial<FilterOptions>) => void;
}

export function FilterPanel({ projects, filters, onFiltersChange }: FilterPanelProps) {
  const allTracks = getUniqueValues(projects, 'tracks');
  const allCountries = getUniqueValues(projects, 'country');

  const updateFilters = (updates: Partial<FilterOptions>) => {
    onFiltersChange(updates);
  };

  const clearFilters = () => {
    onFiltersChange({
      search: '',
      tracks: [],
      countries: [],
      teamSizeRange: [1, 50],
      likesRange: [0, 100],
      sortBy: 'likes',
      sortOrder: 'desc',
    });
  };

  const hasActiveFilters = filters.search || filters.tracks.length > 0 || filters.countries.length > 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Filter className="h-4 w-4" />
          Advanced Filters
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFilters}
              className="ml-auto h-6 px-2"
            >
              <X className="h-3 w-3" />
              Clear All
            </Button>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Sort */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">Sort By</Label>
          <Select
            value={filters.sortBy}
            onValueChange={(value) => updateFilters({ sortBy: value as FilterOptions['sortBy'] })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="likes">Likes</SelectItem>
              <SelectItem value="comments">Comments</SelectItem>
              <SelectItem value="name">Name</SelectItem>
              <SelectItem value="country">Country</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Sort Order */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">Order</Label>
          <Select
            value={filters.sortOrder}
            onValueChange={(value) => updateFilters({ sortOrder: value as FilterOptions['sortOrder'] })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="desc">Descending</SelectItem>
              <SelectItem value="asc">Ascending</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Tracks */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">Tracks ({filters.tracks.length} selected)</Label>
          <Select
            value=""
            onValueChange={(value) => {
              if (value && !filters.tracks.includes(value)) {
                updateFilters({ tracks: [...filters.tracks, value] });
              }
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Add track filter..." />
            </SelectTrigger>
            <SelectContent>
              {allTracks
                .filter(track => !filters.tracks.includes(track))
                .map((track) => (
                <SelectItem key={track} value={track}>
                  {track}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {filters.tracks.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {filters.tracks.map((track) => (
                <Button
                  key={track}
                  variant="secondary"
                  size="sm"
                  onClick={() => updateFilters({ tracks: filters.tracks.filter(t => t !== track) })}
                  className="h-6 px-2 text-xs"
                >
                  {track}
                  <X className="ml-1 h-3 w-3" />
                </Button>
              ))}
            </div>
          )}
        </div>

        {/* Countries */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">Countries ({filters.countries.length} selected)</Label>
          <Select
            value=""
            onValueChange={(value) => {
              if (value && !filters.countries.includes(value)) {
                updateFilters({ countries: [...filters.countries, value] });
              }
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Add country filter..." />
            </SelectTrigger>
            <SelectContent>
              {allCountries
                .filter(country => !filters.countries.includes(country))
                .map((country) => (
                <SelectItem key={country} value={country}>
                  {country}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {filters.countries.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {filters.countries.map((country) => (
                <Button
                  key={country}
                  variant="secondary"
                  size="sm"
                  onClick={() => updateFilters({ countries: filters.countries.filter(c => c !== country) })}
                  className="h-6 px-2 text-xs"
                >
                  {country}
                  <X className="ml-1 h-3 w-3" />
                </Button>
              ))}
            </div>
          )}
        </div>

        {/* Team Size Range */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">
            Team Size ({filters.teamSizeRange[0]} - {filters.teamSizeRange[1]} members)
          </Label>
          <div className="grid grid-cols-2 gap-2">
            <Input
              type="number"
              placeholder="Min"
              value={filters.teamSizeRange[0]}
              onChange={(e) => updateFilters({ 
                teamSizeRange: [parseInt(e.target.value) || 1, filters.teamSizeRange[1]] 
              })}
              min="1"
              max="50"
            />
            <Input
              type="number"
              placeholder="Max"
              value={filters.teamSizeRange[1]}
              onChange={(e) => updateFilters({ 
                teamSizeRange: [filters.teamSizeRange[0], parseInt(e.target.value) || 50] 
              })}
              min="1"
              max="50"
            />
          </div>
        </div>

        {/* Likes Range */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">
            Likes Range ({filters.likesRange[0]} - {filters.likesRange[1]} likes)
          </Label>
          <div className="grid grid-cols-2 gap-2">
            <Input
              type="number"
              placeholder="Min"
              value={filters.likesRange[0]}
              onChange={(e) => updateFilters({ 
                likesRange: [parseInt(e.target.value) || 0, filters.likesRange[1]] 
              })}
              min="0"
            />
            <Input
              type="number"
              placeholder="Max"
              value={filters.likesRange[1]}
              onChange={(e) => updateFilters({ 
                likesRange: [filters.likesRange[0], parseInt(e.target.value) || 100] 
              })}
              min="0"
            />
          </div>
        </div>

        {/* Filter Summary */}
        {hasActiveFilters && (
          <div className="pt-2 border-t">
            <div className="text-xs text-muted-foreground">
              Active filters: {[
                filters.search && `Search: "${filters.search}"`,
                filters.tracks.length > 0 && `${filters.tracks.length} track${filters.tracks.length > 1 ? 's' : ''}`,
                filters.countries.length > 0 && `${filters.countries.length} countr${filters.countries.length > 1 ? 'ies' : 'y'}`
              ].filter(Boolean).join(', ')}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

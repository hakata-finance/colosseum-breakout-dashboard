'use client';

import { useEffect, useRef, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Project, FilterOptions } from "@/types/project";
import { getUniqueValues } from "@/lib/utils";
import { Filter, X, ChevronRight, Plus, Check } from "lucide-react";

interface FilterSidebarProps {
  projects: Project[];
  filters: FilterOptions;
  onFiltersChange: (filters: Partial<FilterOptions>) => void;
  isOpen: boolean;
  onClose: () => void;
}

interface AutocompleteInputProps {
  label: string;
  placeholder: string;
  selectedItems: string[];
  availableItems: string[];
  onItemsChange: (items: string[]) => void;
}

function AutocompleteInput({ label, placeholder, selectedItems, availableItems, onItemsChange }: AutocompleteInputProps) {
  const [inputValue, setInputValue] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const filteredItems = availableItems.filter(item => 
    !selectedItems.includes(item) && 
    item.toLowerCase().includes(inputValue.toLowerCase())
  ).slice(0, 8); // Limit to 8 suggestions

  const handleInputChange = (value: string) => {
    setInputValue(value);
    setIsOpen(true);
    setHighlightedIndex(-1);
  };

  const handleSelectItem = (item: string) => {
    if (!selectedItems.includes(item)) {
      onItemsChange([...selectedItems, item]);
    }
    setInputValue('');
    setIsOpen(false);
    setHighlightedIndex(-1);
  };

  const handleRemoveItem = (item: string) => {
    onItemsChange(selectedItems.filter(i => i !== item));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex(prev => Math.min(prev + 1, filteredItems.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex(prev => Math.max(prev - 1, -1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (highlightedIndex >= 0 && filteredItems[highlightedIndex]) {
        handleSelectItem(filteredItems[highlightedIndex]);
      } else if (inputValue.trim() && !selectedItems.includes(inputValue.trim())) {
        // Allow adding custom values
        handleSelectItem(inputValue.trim());
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
      setHighlightedIndex(-1);
    }
  };

  const handleAddCustom = () => {
    if (inputValue.trim() && !selectedItems.includes(inputValue.trim())) {
      handleSelectItem(inputValue.trim());
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="space-y-3">
      <Label className="text-sm font-semibold">{label} ({selectedItems.length} selected)</Label>
      
      <div className="relative" ref={dropdownRef}>
        <div className="flex gap-2">
          <Input
            ref={inputRef}
            type="text"
            placeholder={placeholder}
            value={inputValue}
            onChange={(e) => handleInputChange(e.target.value)}
            onFocus={() => setIsOpen(true)}
            onKeyDown={handleKeyDown}
            className="flex-1"
          />
          {inputValue.trim() && !availableItems.includes(inputValue.trim()) && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleAddCustom}
              className="shrink-0"
            >
              <Plus className="h-3 w-3 mr-1" />
              Add
            </Button>
          )}
        </div>

        {/* Dropdown */}
        {isOpen && filteredItems.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-popover border rounded-md shadow-lg z-50 max-h-48 overflow-y-auto">
            {filteredItems.map((item, index) => (
              <button
                key={item}
                onClick={() => handleSelectItem(item)}
                className={`w-full text-left px-3 py-2 text-sm hover:bg-accent transition-colors flex items-center justify-between ${
                  index === highlightedIndex ? 'bg-accent' : ''
                }`}
              >
                <span>{item}</span>
                <Check className="h-3 w-3 opacity-50" />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Selected items */}
      {selectedItems.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selectedItems.map((item) => (
            <Button
              key={item}
              variant="secondary"
              size="sm"
              onClick={() => handleRemoveItem(item)}
              className="h-7 px-3 text-xs hover:bg-destructive/10 hover:text-destructive transition-colors"
            >
              {item}
              <X className="ml-1 h-3 w-3" />
            </Button>
          ))}
        </div>
      )}
    </div>
  );
}

export function FilterSidebar({ projects, filters, onFiltersChange, isOpen, onClose }: FilterSidebarProps) {
  const sidebarRef = useRef<HTMLDivElement>(null);
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
    });
  };

  const hasActiveFilters = filters.search || filters.tracks.length > 0 || filters.countries.length > 0;

  // Close on outside click (but not when interacting with dropdowns)
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (sidebarRef.current && !sidebarRef.current.contains(event.target as Node)) {
        // Check if click is on a dropdown or popover
        const target = event.target as Element;
        if (!target.closest('[role="listbox"]') && !target.closest('.absolute')) {
          onClose();
        }
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  // Close on escape key
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose]);

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-black/30 backdrop-blur-sm z-40 transition-opacity duration-300 ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
      />
      
      {/* Sidebar */}
      <div
        ref={sidebarRef}
        className={`fixed top-0 right-0 h-full w-96 bg-background border-l shadow-2xl z-50 transform transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b bg-muted/30">
            <div className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              <h2 className="text-lg font-semibold">Filters</h2>
              {hasActiveFilters && (
                <span className="ml-2 bg-hakata-accent dark:bg-hakata-accent text-white dark:text-hakata-dark rounded-full w-2 h-2" />
              )}
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-8 w-8 p-0"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Active Filters Summary */}
            {hasActiveFilters && (
              <Card className="bg-hakata-purple/10 dark:bg-hakata-purple/20 border-hakata-purple/30 dark:border-hakata-purple/40">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-hakata-purple dark:text-hakata-light-purple">
                      Active Filters
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={clearFilters}
                      className="h-6 px-2 text-hakata-purple hover:text-hakata-purple/80 dark:text-hakata-light-purple dark:hover:text-hakata-light-purple/80"
                    >
                      <X className="h-3 w-3 mr-1" />
                      Clear All
                    </Button>
                  </div>
                  <div className="text-xs text-hakata-purple/80 dark:text-hakata-light-purple/80">
                    {[
                      filters.search && `Search: "${filters.search}"`,
                      filters.tracks.length > 0 && `${filters.tracks.length} track${filters.tracks.length > 1 ? 's' : ''}`,
                      filters.countries.length > 0 && `${filters.countries.length} countr${filters.countries.length > 1 ? 'ies' : 'y'}`
                    ].filter(Boolean).join(', ')}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Tracks */}
            <AutocompleteInput
              label="Tracks"
              placeholder="Type to search or add tracks..."
              selectedItems={filters.tracks}
              availableItems={allTracks}
              onItemsChange={(tracks) => updateFilters({ tracks })}
            />

            {/* Countries */}
            <AutocompleteInput
              label="Countries"
              placeholder="Type to search or add countries..."
              selectedItems={filters.countries}
              availableItems={allCountries}
              onItemsChange={(countries) => updateFilters({ countries })}
            />

            {/* Team Size Range */}
            <div className="space-y-3">
              <Label className="text-sm font-semibold">
                Team Size ({filters.teamSizeRange[0]} - {filters.teamSizeRange[1]} members)
              </Label>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs text-muted-foreground">Min</Label>
                  <Input
                    type="number"
                    placeholder="Min"
                    value={filters.teamSizeRange[0]}
                    onChange={(e) => updateFilters({ 
                      teamSizeRange: [parseInt(e.target.value) || 1, filters.teamSizeRange[1]] 
                    })}
                    min="1"
                    max="50"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Max</Label>
                  <Input
                    type="number"
                    placeholder="Max"
                    value={filters.teamSizeRange[1]}
                    onChange={(e) => updateFilters({ 
                      teamSizeRange: [filters.teamSizeRange[0], parseInt(e.target.value) || 50] 
                    })}
                    min="1"
                    max="50"
                    className="mt-1"
                  />
                </div>
              </div>
            </div>

            {/* Likes Range */}
            <div className="space-y-3">
              <Label className="text-sm font-semibold">
                Likes Range ({filters.likesRange[0]} - {filters.likesRange[1]} likes)
              </Label>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs text-muted-foreground">Min</Label>
                  <Input
                    type="number"
                    placeholder="Min"
                    value={filters.likesRange[0]}
                    onChange={(e) => updateFilters({ 
                      likesRange: [parseInt(e.target.value) || 0, filters.likesRange[1]] 
                    })}
                    min="0"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Max</Label>
                  <Input
                    type="number"
                    placeholder="Max"
                    value={filters.likesRange[1]}
                    onChange={(e) => updateFilters({ 
                      likesRange: [filters.likesRange[0], parseInt(e.target.value) || 100] 
                    })}
                    min="0"
                    className="mt-1"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

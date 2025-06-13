'use client';

import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function HeaderNotification() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Check if user has dismissed this notification before
    const dismissed = localStorage.getItem('header-notification-dismissed');
    if (!dismissed) {
      setIsVisible(true);
    }
  }, []);

  const handleDismiss = () => {
    setIsVisible(false);
    localStorage.setItem('header-notification-dismissed', 'true');
  };

  if (!isVisible) return null;

  return (
    <div className="bg-blue-600/90 backdrop-blur-sm border-b border-blue-500/20 text-white">
      <div className="container mx-auto px-6 py-2">
        <div className="flex items-center justify-between text-sm">
          <div className="flex-1 text-center">
            Still tracking teams without the hype? Missing any features or metrics? →{' '}
            <a 
              href="https://t.me/tenequm" 
              target="_blank" 
              rel="noopener noreferrer"
              className="font-medium underline hover:no-underline"
            >
              t.me/tenequm
            </a>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDismiss}
            className="ml-4 h-6 w-6 p-0 text-white hover:bg-white/20"
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      </div>
    </div>
  );
}
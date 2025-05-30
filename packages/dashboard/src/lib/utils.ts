import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatNumber(num: number | undefined | null): string {
  if (num === null || num === undefined) return '0';
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

export function formatPercentage(num: number, decimals: number = 1): string {
  return `${num.toFixed(decimals)}%`;
}

export function truncate(text: string | undefined, maxLength: number = 40): string {
  if (!text) return 'N/A';
  return text.length > maxLength ? text.substring(0, maxLength - 3) + '...' : text;
}

export function getUniqueValues<T>(array: T[], key: keyof T): string[] {
  const values = array
    .map(item => item[key])
    .filter(Boolean)
    .flatMap(value => Array.isArray(value) ? value : [value])
    .map(String);
  
  return Array.from(new Set(values)).sort();
} 
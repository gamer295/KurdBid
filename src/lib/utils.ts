import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: any) {
  if (!date) return '';
  const d = date.toDate ? date.toDate() : new Date(date);
  const lang = localStorage.getItem('kurd-bid-lang') || 'ku';
  
  if (lang === 'ku') {
    return d.toLocaleDateString('ku-Arab-IQ', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  }

  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
}

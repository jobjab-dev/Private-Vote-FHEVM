import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatAddress(address: string): string {
  if (!address) return '';
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export function formatTimeRemaining(timestamp: number): string {
  const now = Date.now();
  const timeLeft = timestamp - now;

  if (timeLeft <= 0) return 'Ended';

  const days = Math.floor(timeLeft / (1000 * 60 * 60 * 24));
  const hours = Math.floor((timeLeft % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));

  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

export function getPollStatus(startTime: number, endTime: number, revealed: boolean) {
  const now = Date.now();
  
  if (revealed) return 'revealed';
  if (now < startTime) return 'upcoming';
  if (now >= startTime && now < endTime) return 'active';
  return 'ended';
}

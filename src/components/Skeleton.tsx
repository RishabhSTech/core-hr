// src/components/Skeleton.tsx
import React from 'react';

export function Skeleton({ className = '' }: { className?: string }) {
  return (
    <div
      className={`animate-pulse bg-gray-200 rounded ${className}`}
      aria-busy="true"
      aria-label="Loading"
    />
  );
}

export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex gap-4 p-4 bg-gray-50 rounded">
          <Skeleton className="h-12 w-12 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function CardSkeleton() {
  return (
    <div className="p-4 bg-white rounded-lg border border-gray-200 space-y-4">
      <Skeleton className="h-6 w-1/3" />
      <div className="space-y-2">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
      </div>
    </div>
  );
}

export function FormSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-10 w-1/3" />
    </div>
  );
}

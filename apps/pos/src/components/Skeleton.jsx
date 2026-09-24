// File: apps/pos/src/components/Skeleton.jsx
/**
 * Reusable skeleton loading components.
 * Usage: <SkeletonTable rows={5} /> or <SkeletonCard />
 */
import React from 'react';
import clsx from 'clsx';

// Base pulse block
export function SkeletonBlock({ className }) {
  return (
    <div
      className={clsx(
        'animate-pulse rounded-lg bg-gray-200',
        className
      )}
    />
  );
}

// Table skeleton — mimics the product/order table layout
export function SkeletonTable({ rows = 5, cols = 5 }) {
  return (
    <div className="overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm">
      {/* Header */}
      <div className="flex gap-4 border-b bg-gray-50 px-4 py-3">
        {Array.from({ length: cols }).map((_, i) => (
          <SkeletonBlock key={i} className="h-3 flex-1 rounded" />
        ))}
      </div>
      {/* Rows */}
      {Array.from({ length: rows }).map((_, rowIdx) => (
        <div key={rowIdx} className="flex items-center gap-4 border-b px-4 py-4 last:border-0">
          <SkeletonBlock className="h-10 w-10 flex-shrink-0 rounded-lg" />
          {Array.from({ length: cols - 1 }).map((_, colIdx) => (
            <SkeletonBlock
              key={colIdx}
              className={clsx('h-3 flex-1', colIdx === 0 ? 'max-w-[180px]' : '')}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

// Order card skeleton — mimics CashierView order list items
export function SkeletonOrderCard() {
  return (
    <div className="space-y-3 p-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="flex items-center justify-between gap-3 rounded-xl border border-gray-100 p-3">
          <div className="flex-1 space-y-2">
            <SkeletonBlock className="h-3 w-24" />
            <SkeletonBlock className="h-2 w-32" />
          </div>
          <SkeletonBlock className="h-5 w-16 rounded-full" />
        </div>
      ))}
    </div>
  );
}

// KPI card skeleton — mimics ReportsDashboard stat cards
export function SkeletonKPI({ count = 4 }) {
  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="rounded-xl border-l-4 border-gray-200 bg-white p-4 shadow-sm">
          <SkeletonBlock className="h-2 w-20 mb-3" />
          <SkeletonBlock className="h-6 w-28 mb-2" />
          <SkeletonBlock className="h-2 w-16" />
        </div>
      ))}
    </div>
  );
}

// Product grid skeleton — mimics QR Web menu grid
export function SkeletonProductGrid({ count = 6 }) {
  return (
    <div className="grid grid-cols-2 gap-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
          <SkeletonBlock className="h-28 w-full rounded-none" />
          <div className="p-3 space-y-2">
            <SkeletonBlock className="h-3 w-3/4" />
            <SkeletonBlock className="h-2 w-1/2" />
            <div className="flex justify-between items-center mt-2">
              <SkeletonBlock className="h-3 w-16" />
              <SkeletonBlock className="h-7 w-7 rounded-full" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

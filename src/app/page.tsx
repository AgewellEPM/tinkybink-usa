'use client';

import dynamic from 'next/dynamic';
import { Suspense } from 'react';
import { Header } from '@/components/layouts/Header';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

// Dynamic imports for code splitting - only load what's needed
const BoardManager = dynamic(
  () => import('@/components/modules/BoardManager').then(mod => ({ default: mod.BoardManager })),
  { 
    loading: () => <LoadingSpinner />,
    ssr: false // Client-side only for performance
  }
);

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gray-950">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        <Suspense fallback={<LoadingSpinner />}>
          <BoardManager />
        </Suspense>
      </main>
    </div>
  );
}
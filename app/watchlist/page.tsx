'use client';

import { Suspense } from 'react';
import WatchlistContent from '@/components/WatchlistContent';

export default function WatchlistPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <WatchlistContent />
    </Suspense>
  );
}

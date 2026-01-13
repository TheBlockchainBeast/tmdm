'use client';

import { Suspense } from 'react';
import PortfolioContent from '@/components/PortfolioContent';

export default function PortfolioPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <PortfolioContent />
    </Suspense>
  );
}

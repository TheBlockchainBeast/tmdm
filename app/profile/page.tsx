'use client';

import { Suspense } from 'react';
import ProfileContent from '@/components/ProfileContent';

export default function ProfilePage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ProfileContent />
    </Suspense>
  );
}

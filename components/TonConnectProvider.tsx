'use client';

import { TonConnectUIProvider } from '@tonconnect/ui-react';
import { useEffect, useState } from 'react';

export default function TonConnectProvider({ children }: { children: React.ReactNode }) {
  const [manifestUrl, setManifestUrl] = useState<string>('');

  useEffect(() => {
    // Use GitHub raw URL for manifest.json
    // TON Connect requires HTTPS, so we use GitHub raw URL even for localhost
    // Set NEXT_PUBLIC_MANIFEST_URL environment variable or update the URL below
    const githubManifestUrl = process.env.NEXT_PUBLIC_MANIFEST_URL || 
      'https://raw.githubusercontent.com/theblockchainbeast/tmdm/main/public/manifest.json';
    
    // Check if it's a placeholder URL
    if (githubManifestUrl.includes('YOUR_USERNAME') || githubManifestUrl.includes('YOUR_REPO')) {
      console.warn('⚠️ TON Connect Manifest: Please update NEXT_PUBLIC_MANIFEST_URL or the GitHub URL in TonConnectProvider.tsx');
      // Still set it so the app doesn't break, but it won't work until configured
      setManifestUrl(githubManifestUrl);
    } else {
      setManifestUrl(githubManifestUrl);
    }
  }, []);

  if (!manifestUrl) {
    return <>{children}</>;
  }

  return (
    <TonConnectUIProvider manifestUrl={manifestUrl}>
      {children}
    </TonConnectUIProvider>
  );
}

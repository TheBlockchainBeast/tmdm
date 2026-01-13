import TokenDetail from '@/components/TokenDetail';

interface TokenPageProps {
  params: {
    address: string;
  };
}

export default function TokenPage({ params }: TokenPageProps) {
  return <TokenDetail address={params.address} />;
}

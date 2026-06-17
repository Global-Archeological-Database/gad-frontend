'use client';

import dynamic from 'next/dynamic';

const MapExplorer = dynamic(() => import('@/components/map/MapExplorer'), {
  ssr: false,
});

export default function Home() {
  return <MapExplorer />;
}

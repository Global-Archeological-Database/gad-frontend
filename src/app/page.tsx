import MapExplorer from '@/components/map/MapExplorer';

export const metadata = {
  title: 'GAD — Map Explorer',
  description:
    'Explore archaeological artifacts from around the world on an interactive map.',
};

export default function Home() {
  return <MapExplorer />;
}

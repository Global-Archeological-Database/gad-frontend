'use client';

import { APIProvider, Map } from '@vis.gl/react-google-maps';
import { useMemo, useState, useCallback } from 'react';
import { AnimatePresence } from 'framer-motion';
import { Plus } from 'lucide-react';
import Link from 'next/link';
import { useTheme } from 'next-themes';
import { useArtifacts } from '@/hooks/useArtifacts';
import { useMapStore } from '@/store/mapStore';
import { useAuthStore } from '@/store/authStore';
import ArtifactMarker from '@/components/map/ArtifactMarker';
import ArtifactInfoWindow from '@/components/map/ArtifactInfoWindow';
import ArtifactDetailPanel from '@/components/artifacts/ArtifactDetailPanel';
import MapSearchBar from '@/components/map/MapSearchBar';
import type { Artifact } from '@/types/artifact';

const LIGHT_MAP_STYLE = [
  { featureType: 'poi', stylers: [{ visibility: 'off' }] },
  { featureType: 'road', stylers: [{ saturation: -20 }] },
  {
    featureType: 'water',
    stylers: [{ color: '#a0c4d8' }],
  },
  {
    featureType: 'landscape',
    stylers: [{ color: '#f5f0e8' }],
  },
  {
    featureType: 'all',
    stylers: [{ saturation: -20 }],
  },
];

const DARK_MAP_STYLE = [
  { elementType: 'geometry', stylers: [{ color: '#1A1510' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#9A8C7D' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#1A1510' }] },
  {
    featureType: 'water',
    elementType: 'geometry',
    stylers: [{ color: '#1A2A35' }],
  },
  {
    featureType: 'road',
    elementType: 'geometry',
    stylers: [{ color: '#2A2520' }],
  },
  {
    featureType: 'road',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#D4C5A9' }],
  },
  { featureType: 'poi', stylers: [{ visibility: 'off' }] },
  { featureType: 'transit', stylers: [{ visibility: 'off' }] },
  {
    featureType: 'administrative',
    elementType: 'geometry.stroke',
    stylers: [{ color: '#3D3529' }],
  },
  {
    featureType: 'administrative',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#9A8C7D' }],
  },
];

/**
 * Hard map bounds — prevents infinite scroll / repeated world maps.
 * strictBounds: false allows slight overflow for smooth UX.
 */
const MAP_RESTRICTION = {
  latLngBounds: {
    north: 85,
    south: -85,
    west: -180,
    east: 180,
  },
  strictBounds: false,
};

export default function MapExplorer() {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? '';
  const mapId = process.env.NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID ?? '';

  const { resolvedTheme } = useTheme();

  const selectedArtifactId = useMapStore((s) => s.selectedArtifactId);
  const setSelectedArtifactId = useMapStore((s) => s.setSelectedArtifactId);
  const isDetailPanelOpen = useMapStore((s) => s.isDetailPanelOpen);
  const setIsDetailPanelOpen = useMapStore((s) => s.setIsDetailPanelOpen);
  const user = useAuthStore((s) => s.user);

  // ── Search state ──────────────────────────────────────────────
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');

  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query);
    setDebouncedQuery(query);
  }, []);

  // ── Artifact fetching (no server-side search) ─────────────────
  const { data, isLoading } = useArtifacts();

  const artifacts = data?.artifacts ?? [];

  // ── Client-side search filtering ──────────────────────────────
  const filteredArtifacts = useMemo(() => {
    if (!debouncedQuery) return artifacts;
    const query = debouncedQuery.toLowerCase();
    return artifacts.filter((a) => {
      const searchable = [
        a.title,
        a.cultural_origin,
        a.location?.country,
        a.country,
        ...(a.tags || []),
      ]
        .filter((s): s is string => typeof s === 'string')
        .map((s) => s.toLowerCase());
      return searchable.some((s) => s.includes(query));
    });
  }, [artifacts, debouncedQuery]);

  const isFilterActive = debouncedQuery.length > 0 && artifacts.length > 0;

  const selectedArtifact = useMemo(
    () => artifacts.find((a) => a.id === selectedArtifactId) ?? null,
    [artifacts, selectedArtifactId],
  );

  // ── Viewport culling — only render markers within current map bounds ──
  const [mapBounds, setMapBounds] = useState<google.maps.LatLngBounds | null>(null);

  const handleBoundsChanged = useCallback(
    (evt: { map: google.maps.Map }) => {
      setMapBounds(evt.map.getBounds() ?? null);
    },
    [],
  );

  const visibleArtifacts = useMemo(() => {
    if (!mapBounds || !artifacts) return artifacts || [];
    return artifacts.filter((a: Artifact) => {
      const lat = a.latitude ?? a.location?.coordinates?.latitude;
      const lng = a.longitude ?? a.location?.coordinates?.longitude;
      if (lat == null || lng == null) return false;
      return mapBounds.contains({ lat, lng });
    });
  }, [artifacts, mapBounds]);

  // ── Handlers ──────────────────────────────────────────────────
  const handleMarkerClick = (id: string) => {
    setSelectedArtifactId(id);
  };

  const handleInfoWindowClose = () => {
    setSelectedArtifactId(null);
  };

  const handleViewDetails = () => {
    setIsDetailPanelOpen(true);
  };

  const handleDetailPanelClose = () => {
    setIsDetailPanelOpen(false);
    setSelectedArtifactId(null);
  };

  return (
    <APIProvider apiKey={apiKey}>
      <div className="relative w-full h-[100dvh] overflow-hidden">
        {/* Map */}
        <Map
          defaultCenter={{ lat: 25, lng: 15 }}
          defaultZoom={3}
          minZoom={2}
          maxZoom={18}
          gestureHandling="greedy"
          disableDefaultUI={true}
          styles={resolvedTheme === 'dark' ? DARK_MAP_STYLE : LIGHT_MAP_STYLE}
          mapTypeControl={false}
          streetViewControl={false}
          fullscreenControl={false}
          zoomControl={false}
          mapId={mapId}
          className="w-full h-full"
          restriction={MAP_RESTRICTION}
          onBoundsChanged={handleBoundsChanged}
        >
          {visibleArtifacts.map((artifact) => {
            const isSelected = artifact.id === selectedArtifactId;
            const isDimmed =
              isFilterActive &&
              !filteredArtifacts.some((a) => a.id === artifact.id);
            return (
              <ArtifactMarker
                key={artifact.id}
                artifact={artifact}
                onClick={() => handleMarkerClick(artifact.id)}
                isSelected={isSelected}
                isDimmed={isDimmed}
              />
            );
          })}

          {/* InfoWindow for selected artifact */}
          {selectedArtifact && !isDetailPanelOpen && (
            <ArtifactInfoWindow
              artifact={selectedArtifact}
              onClose={handleInfoWindowClose}
              onViewDetails={handleViewDetails}
            />
          )}
        </Map>

        {/* Search bar — floating top-center */}
        <MapSearchBar
          onSearch={handleSearch}
          totalCount={artifacts.length}
          filteredCount={filteredArtifacts.length}
          isFilterActive={isFilterActive}
          isLoading={isLoading}
        />

        {/* Loading indicator */}
        {isLoading && (
          <div className="absolute top-20 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2 bg-background/95 backdrop-blur-sm rounded-full px-4 py-2 shadow-warm-md text-sm text-muted-foreground">
            <div className="w-4 h-4 rounded-full border-2 border-primary/30 border-t-primary animate-spin" />
            <span>Loading artifacts...</span>
          </div>
        )}

        {/* "+" FAB — only when authenticated — navigates to /submit */}
        {user && (
          <Link
            href="/submit"
            className="fixed bottom-6 right-6 z-40 h-14 w-14 rounded-full shadow-warm-xl hover:shadow-golden bg-primary hover:bg-primary/90 transition-all duration-300 hover:scale-110 active:scale-95 flex items-center justify-center"
            aria-label="Submit new artifact"
          >
            <Plus className="h-6 w-6 text-primary-foreground" />
          </Link>
        )}

        {/* Detail Panel */}
        <AnimatePresence>
          {isDetailPanelOpen && selectedArtifactId && (
            <ArtifactDetailPanel
              artifactId={selectedArtifactId}
              onClose={handleDetailPanelClose}
            />
          )}
        </AnimatePresence>
      </div>
    </APIProvider>
  );
}

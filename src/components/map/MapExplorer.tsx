'use client';

import { APIProvider, Map } from '@vis.gl/react-google-maps';
import { useMemo, useState, useCallback } from 'react';
import { AnimatePresence } from 'framer-motion';
import { Plus, Loader2 } from 'lucide-react';
import { useArtifacts } from '@/hooks/useArtifacts';
import { useMapStore } from '@/store/mapStore';
import { useAuthStore } from '@/store/authStore';
import { useUiStore } from '@/store/uiStore';
import ArtifactMarker from '@/components/map/ArtifactMarker';
import ArtifactInfoWindow from '@/components/map/ArtifactInfoWindow';
import ArtifactDetailPanel from '@/components/artifacts/ArtifactDetailPanel';
import ArtifactSubmitForm from '@/components/artifacts/ArtifactSubmitForm';
import MapSearchBar from '@/components/map/MapSearchBar';

const MAP_STYLE = [
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

export default function MapExplorer() {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? '';
  const mapId = process.env.NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID ?? '';

  const selectedArtifactId = useMapStore((s) => s.selectedArtifactId);
  const setSelectedArtifactId = useMapStore((s) => s.setSelectedArtifactId);
  const isDetailPanelOpen = useMapStore((s) => s.isDetailPanelOpen);
  const setIsDetailPanelOpen = useMapStore((s) => s.setIsDetailPanelOpen);
  const user = useAuthStore((s) => s.user);
  const setIsSubmitFormOpen = useUiStore((s) => s.setIsSubmitFormOpen);

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
          defaultCenter={{ lat: 30, lng: 10 }}
          defaultZoom={3}
          gestureHandling="greedy"
          disableDefaultUI={true}
          styles={MAP_STYLE}
          mapTypeControl={false}
          streetViewControl={false}
          fullscreenControl={false}
          zoomControl={false}
          mapId={mapId}
          className="w-full h-full"
        >
          {artifacts.map((artifact) => {
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
          <div className="absolute top-20 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2 bg-white/80 backdrop-blur-sm rounded-full px-4 py-2 shadow-warm-sm text-xs text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading artifacts...
          </div>
        )}

        {/* "+" FAB — only when authenticated */}
        {user && (
          <button
            onClick={() => setIsSubmitFormOpen(true)}
            className="fixed bottom-6 right-6 z-40 h-14 w-14 rounded-full shadow-warm-xl hover:shadow-golden bg-primary hover:bg-primary/90 transition-all duration-300 hover:scale-110 active:scale-95 flex items-center justify-center"
            aria-label="Submit new artifact"
          >
            <Plus className="h-6 w-6 text-primary-foreground" />
          </button>
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

        {/* Submit Form Sheet */}
        <ArtifactSubmitForm />
      </div>
    </APIProvider>
  );
}

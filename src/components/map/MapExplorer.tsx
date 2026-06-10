'use client';

import { APIProvider, Map } from '@vis.gl/react-google-maps';
import { useMemo, useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Plus, X, Loader2 } from 'lucide-react';
import { useArtifacts } from '@/hooks/useArtifacts';
import { useMapStore } from '@/store/mapStore';
import { useAuthStore } from '@/store/authStore';
import { useUiStore } from '@/store/uiStore';
import ArtifactMarker from '@/components/map/ArtifactMarker';
import ArtifactInfoWindow from '@/components/map/ArtifactInfoWindow';
import ArtifactDetailPanel from '@/components/artifacts/ArtifactDetailPanel';
import ArtifactSubmitForm from '@/components/artifacts/ArtifactSubmitForm';

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
  const router = useRouter();
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
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Debounce search input — 400ms delay
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setDebouncedQuery(searchQuery.trim());
    }, 400);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [searchQuery]);

  // Clear search
  const handleClearSearch = () => {
    setSearchQuery('');
    setDebouncedQuery('');
  };

  // ── Artifact fetching ─────────────────────────────────────────
  // Pass `q` param only when there's an active search query
  const filters = debouncedQuery ? { q: debouncedQuery } : undefined;
  const { data, isLoading, isFetching } = useArtifacts(filters);

  const artifacts = data?.artifacts ?? [];
  const isSearching = isFetching && !!debouncedQuery;
  const hasSearched = !!debouncedQuery && !isFetching;
  const noResults = hasSearched && artifacts.length === 0;

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
      <div
        style={{
          position: 'relative',
          width: '100%',
          height: 'calc(100vh - 64px)',
        }}
      >
        {/* Map */}
        <Map
          defaultCenter={{ lat: 20, lng: 0 }}
          defaultZoom={3}
          gestureHandling="greedy"
          disableDefaultUI={false}
          styles={MAP_STYLE}
          mapTypeControl={false}
          streetViewControl={false}
          fullscreenControl={false}
          mapId={mapId}
          style={{ width: '100%', height: '100%' }}
        >
          {artifacts.map((artifact) => (
            <ArtifactMarker
              key={artifact.id}
              artifact={artifact}
              onClick={() => handleMarkerClick(artifact.id)}
            />
          ))}

          {/* InfoWindow for selected artifact */}
          {selectedArtifact && (
            <ArtifactInfoWindow
              artifact={selectedArtifact}
              onClose={handleInfoWindowClose}
              onViewDetails={handleViewDetails}
            />
          )}
        </Map>

        {/* Search bar — floating top-center */}
        <div
          style={{
            position: 'absolute',
            top: 16,
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 10,
            width: '90%',
            maxWidth: 400,
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '10px 16px',
              backgroundColor: '#FFFFFF',
              borderRadius: 999,
              boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
              border: '1px solid #D4C5A9',
            }}
          >
            <Search size={18} color="#888780" />
            <input
              type="text"
              placeholder="Search artifacts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                flex: 1,
                border: 'none',
                outline: 'none',
                fontSize: 14,
                color: '#1A1208',
                backgroundColor: 'transparent',
                fontFamily: 'inherit',
              }}
            />
            {/* Clear button — visible when there's input */}
            {searchQuery && (
              <button
                onClick={handleClearSearch}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: 0,
                  color: '#888780',
                }}
                aria-label="Clear search"
              >
                <X size={16} />
              </button>
            )}
            {/* Loading spinner — visible while search is in flight */}
            {isSearching && (
              <Loader2
                size={16}
                color="#888780"
                style={{ animation: 'spin 1s linear infinite' }}
              />
            )}
          </div>

          {/* No results message */}
          {noResults && (
            <div
              style={{
                marginTop: 8,
                padding: '10px 16px',
                backgroundColor: '#FFFFFF',
                borderRadius: 12,
                boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
                border: '1px solid #D4C5A9',
                textAlign: 'center',
                fontSize: 14,
                color: '#888780',
              }}
            >
              No artifacts found for &ldquo;{debouncedQuery}&rdquo;
            </div>
          )}
        </div>

        {/* "+" FAB — bottom-right, visible to all users */}
        <button
          onClick={() => {
            if (user) {
              setIsSubmitFormOpen(true);
            } else {
              router.push('/login');
            }
          }}
          style={{
            position: 'absolute',
            bottom: 24,
            right: 24,
            zIndex: 10,
            width: 48,
            height: 48,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#B8860B',
            color: '#FFFFFF',
            border: 'none',
            borderRadius: '50%',
            boxShadow: '0 4px 12px rgba(184,134,11,0.4)',
            cursor: 'pointer',
            transition: 'transform 0.2s ease',
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLElement).style.transform = 'scale(1.1)';
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.transform = 'scale(1)';
          }}
          title={user ? 'Submit an artifact' : 'Sign in to submit an artifact'}
        >
          <Plus size={24} />
        </button>

        {/* Loading indicator */}
        {isLoading && (
          <div
            style={{
              position: 'absolute',
              top: 16,
              right: 16,
              zIndex: 10,
              padding: '6px 12px',
              backgroundColor: 'rgba(255,255,255,0.9)',
              borderRadius: 6,
              fontSize: 12,
              color: '#888780',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            }}
          >
            Loading artifacts...
          </div>
        )}

        {/* Detail Panel */}
        <ArtifactDetailPanel
          artifactId={isDetailPanelOpen ? selectedArtifactId : null}
          onClose={handleDetailPanelClose}
        />

        {/* Submit Form Sheet */}
        <ArtifactSubmitForm />
      </div>
    </APIProvider>
  );
}

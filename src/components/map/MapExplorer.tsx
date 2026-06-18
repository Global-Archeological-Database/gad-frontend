'use client';

import { APIProvider, Map } from '@vis.gl/react-google-maps';
import { useMemo, useState, useCallback, useEffect, useRef } from 'react';
import { AnimatePresence } from 'framer-motion';
import { Plus, Layers, MapPin, Satellite, Mountain, Moon } from 'lucide-react';
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

/** Map style/theme options */
type MapTheme = 'streets' | 'terrain' | 'satellite' | 'dark';

const MAP_THEME_OPTIONS: { id: MapTheme; label: string; icon: typeof MapPin }[] = [
  { id: 'streets', label: 'Streets', icon: MapPin },
  { id: 'terrain', label: 'Terrain', icon: Mountain },
  { id: 'satellite', label: 'Satellite', icon: Satellite },
  { id: 'dark', label: 'Dark', icon: Moon },
];

export default function MapExplorer() {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? '';
  const mapId = process.env.NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID ?? '';

  const { resolvedTheme } = useTheme();

  const selectedArtifactId = useMapStore((s) => s.selectedArtifactId);
  const setSelectedArtifactId = useMapStore((s) => s.setSelectedArtifactId);
  const isDetailPanelOpen = useMapStore((s) => s.isDetailPanelOpen);
  const setIsDetailPanelOpen = useMapStore((s) => s.setIsDetailPanelOpen);
  const user = useAuthStore((s) => s.user);

  // ── Map theme state ───────────────────────────────────────────
  const [mapTheme, setMapTheme] = useState<MapTheme>('streets');
  const [themeMenuOpen, setThemeMenuOpen] = useState(false);
  const themeMenuRef = useRef<HTMLDivElement>(null);

  // Close theme menu on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (themeMenuRef.current && !themeMenuRef.current.contains(e.target as Node)) {
        setThemeMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Auto-switch to dark theme when app is in dark mode
  useEffect(() => {
    if (resolvedTheme === 'dark' && mapTheme === 'streets') {
      setMapTheme('dark');
    }
  }, [resolvedTheme, mapTheme]);

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
  const [hasInitialData, setHasInitialData] = useState(false);
  const mapRef = useRef<google.maps.Map | null>(null);

  const handleBoundsChanged = useCallback(
    (map?: google.maps.Map) => {
      // Fix: onBoundsChanged receives the map instance directly, not {map: ...}
      const instance = map || mapRef.current;
      if (instance) {
        mapRef.current = instance;
        setMapBounds(instance.getBounds() ?? null);
      }
    },
    [],
  );

  const visibleArtifacts = useMemo(() => {
    if (!artifacts || artifacts.length === 0) return [];
    // Before initial data load is complete, show ALL artifacts
    if (!hasInitialData || !mapBounds) return artifacts;
    return artifacts.filter((a: Artifact) => {
      const lat = a.latitude ?? a.location?.coordinates?.latitude;
      const lng = a.longitude ?? a.location?.coordinates?.longitude;
      if (lat == null || lng == null) return false;
      return mapBounds.contains({ lat, lng });
    });
  }, [artifacts, mapBounds, hasInitialData]);

  // Set initial data flag when artifacts first arrive
  useEffect(() => {
    if (data && !hasInitialData) {
      setHasInitialData(true);
    }
  }, [data, hasInitialData]);

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

  // Determine which styles to apply based on theme
  const currentStyles = useMemo(() => {
    if (mapTheme === 'dark') return DARK_MAP_STYLE;
    if (mapTheme === 'streets') return LIGHT_MAP_STYLE;
    // terrain and satellite use Google's native rendering — no custom styles
    return undefined;
  }, [mapTheme]);

  /** Lazy map type ID lookup — guarded against server-side rendering where `google` is undefined */
  const currentMapTypeId = useMemo(() => {
    const MAP_TYPE_IDS: Record<MapTheme, google.maps.MapTypeId | undefined> = {
      streets: typeof google !== 'undefined' ? google.maps.MapTypeId.ROADMAP : 'roadmap' as google.maps.MapTypeId,
      terrain: typeof google !== 'undefined' ? google.maps.MapTypeId.TERRAIN : 'terrain' as google.maps.MapTypeId,
      satellite: typeof google !== 'undefined' ? google.maps.MapTypeId.SATELLITE : 'satellite' as google.maps.MapTypeId,
      dark: undefined,
    };
    return MAP_TYPE_IDS[mapTheme];
  }, [mapTheme]);

  return (
    <APIProvider apiKey={apiKey}>
      <div className="relative w-full h-[100dvh] overflow-hidden">
        {/* Map */}
        <Map
          center={{ lat: 25, lng: 15 }}
          zoom={3}
          minZoom={2}
          maxZoom={18}
          gestureHandling="greedy"
          disableDefaultUI={true}
          styles={currentStyles}
          mapTypeId={currentMapTypeId}
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

        {/* Map theme/style selector — floating bottom-left */}
        <div ref={themeMenuRef} className="absolute bottom-6 left-6 z-30">
          <button
            onClick={() => setThemeMenuOpen((prev) => !prev)}
            className="h-10 w-10 rounded-full bg-background/95 backdrop-blur-sm border border-secondary/40 shadow-warm-md flex items-center justify-center hover:bg-accent transition-colors"
            aria-label="Change map style"
            title="Change map style"
          >
            <Layers className="h-5 w-5 text-foreground" />
          </button>

          {themeMenuOpen && (
            <div className="absolute bottom-12 left-0 bg-background/95 backdrop-blur-sm border border-secondary/40 rounded-xl shadow-warm-xl p-1.5 min-w-[160px]">
              {MAP_THEME_OPTIONS.map((option) => {
                const Icon = option.icon;
                const isActive = mapTheme === option.id;
                return (
                  <button
                    key={option.id}
                    onClick={() => {
                      setMapTheme(option.id);
                      setThemeMenuOpen(false);
                    }}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors ${
                      isActive
                        ? 'bg-primary/10 text-primary font-medium'
                        : 'text-foreground hover:bg-accent'
                    }`}
                  >
                    <Icon className={`h-4 w-4 ${isActive ? 'text-primary' : 'text-muted-foreground'}`} />
                    <span>{option.label}</span>
                    {isActive && (
                      <span className="ml-auto h-2 w-2 rounded-full bg-primary" />
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Loading indicator */}
        {isLoading && (
          <div className="absolute top-20 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2 bg-background/95 backdrop-blur-sm rounded-full px-4 py-2 shadow-warm-md text-sm text-muted-foreground">
            <div className="w-4 h-4 rounded-full border-2 border-primary/30 border-t-primary animate-spin" />
            <span>Loading artifacts...</span>
          </div>
        )}

        {/* Empty state — no artifacts loaded */}
        {!isLoading && artifacts.length === 0 && (
          <div className="absolute top-20 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2 bg-background/95 backdrop-blur-sm rounded-full px-4 py-2 shadow-warm-md text-sm text-muted-foreground">
            <MapPin className="h-4 w-4 text-muted-foreground" />
            <span>No artifacts found — be the first to add one!</span>
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

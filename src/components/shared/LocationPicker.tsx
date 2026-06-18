'use client';

import { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { APIProvider, Map, AdvancedMarker, Pin, useMap } from '@vis.gl/react-google-maps';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { MapPinIcon, Layers, Mountain, Satellite, Moon } from 'lucide-react';

export interface LocationValue {
  latitude: number;
  longitude: number;
}

export interface LocationData {
  latitude: number;
  longitude: number;
  country: string;
  state: string;
  city: string;
  region: string;
}

interface LocationPickerProps {
  value: LocationValue | null;
  onChange: (data: LocationData) => void;
}

const DEFAULT_CENTER = { lat: 20, lng: 0 };

/** Map style/theme options — same as MapExplorer */
type MapTheme = 'streets' | 'terrain' | 'satellite' | 'dark';

const MAP_THEME_OPTIONS: { id: MapTheme; label: string; icon: typeof MapPinIcon }[] = [
  { id: 'streets', label: 'Streets', icon: MapPinIcon },
  { id: 'terrain', label: 'Terrain', icon: Mountain },
  { id: 'satellite', label: 'Satellite', icon: Satellite },
  { id: 'dark', label: 'Dark', icon: Moon },
];

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

function MapClickHandler({
  onMapClick,
}: {
  onMapClick: (lat: number, lng: number) => void;
}) {
  const map = useMap();

  useEffect(() => {
    if (!map) return;
    const listener = map.addListener('click', (e: google.maps.MapMouseEvent) => {
      if (e.latLng) {
        onMapClick(e.latLng.lat(), e.latLng.lng());
      }
    });
    return () => listener.remove();
  }, [map, onMapClick]);

  return null;
}

/**
 * Imperatively pans the map when coordinates change programmatically.
 * Uses primitive lat/lng/zoom props so object-reference changes on
 * parent re-render don't trigger unnecessary pans.
 * Skips the initial mount — defaultCenter/defaultZoom handle positioning.
 */
function MapPanController({
  lat,
  lng,
  zoom,
}: {
  lat: number;
  lng: number;
  zoom: number;
}) {
  const map = useMap();
  const initialRef = useRef(true);

  useEffect(() => {
    if (!map) return;
    // Skip the initial mount — the defaultCenter already handles positioning
    if (initialRef.current) {
      initialRef.current = false;
      return;
    }
    map.panTo({ lat, lng });
    map.setZoom(zoom);
  }, [map, lat, lng, zoom]);

  return null;
}

function ReverseGeocoder({
  latitude,
  longitude,
  onResult,
}: {
  latitude: number;
  longitude: number;
  onResult: (data: LocationData) => void;
}) {
  const geocoderRef = useRef<google.maps.Geocoder | null>(null);

  useEffect(() => {
    if (typeof google === 'undefined' || !google.maps) return;
    if (!geocoderRef.current) {
      geocoderRef.current = new google.maps.Geocoder();
    }

    const geocoder = geocoderRef.current;
    geocoder.geocode(
      { location: { lat: latitude, lng: longitude } },
      (results, status) => {
        if (status === 'OK' && results && results.length > 0) {
          const addressComponents = results[0].address_components;
          let country = '';
          let state = '';
          let city = '';
          let region = '';

          for (const component of addressComponents) {
            const types = component.types;
            if (types.includes('country')) {
              country = component.long_name;
            } else if (types.includes('administrative_area_level_1')) {
              state = component.long_name;
            } else if (
              types.includes('locality') ||
              types.includes('administrative_area_level_2')
            ) {
              city = component.long_name;
            } else if (
              types.includes('administrative_area_level_3') ||
              types.includes('sublocality')
            ) {
              region = component.long_name;
            }
          }

          onResult({ latitude, longitude, country, state, city, region });
        }
      }
    );
  }, [latitude, longitude, onResult]);

  return null;
}

export default function LocationPicker({
  value,
  onChange,
}: LocationPickerProps) {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? '';
  const mapId = process.env.NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID ?? '';

  const [latInput, setLatInput] = useState(value?.latitude?.toString() ?? '');
  const [lngInput, setLngInput] = useState(value?.longitude?.toString() ?? '');
  const [locationData, setLocationData] = useState({
    country: '',
    state: '',
    city: '',
    region: '',
  });
  const [reverseGeocode, setReverseGeocode] = useState<string | null>(null);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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

  // ── Refs for debounced values (fixes stale closure in handleCoordInput) ──
  const latInputRef = useRef(latInput);
  const lngInputRef = useRef(lngInput);
  const locationDataRef = useRef(locationData);

  useEffect(() => { latInputRef.current = latInput; }, [latInput]);
  useEffect(() => { lngInputRef.current = lngInput; }, [lngInput]);
  useEffect(() => { locationDataRef.current = locationData; }, [locationData]);

  // Sync inputs when value prop changes externally
  useEffect(() => {
    if (value) {
      setLatInput(value.latitude.toString());
      setLngInput(value.longitude.toString());
    }
  }, [value]);

  const handleReverseGeocodeResult = useCallback(
    (data: LocationData) => {
      setLocationData(data);
      // Build a human-readable reverse geocode string
      const parts = [data.city, data.state, data.country].filter(Boolean);
      setReverseGeocode(parts.length > 0 ? parts.join(', ') : null);
      onChange(data);
    },
    [onChange]
  );

  const handleMapClick = useCallback(
    (lat: number, lng: number) => {
      const loc = { latitude: lat, longitude: lng };
      setLatInput(lat.toFixed(6));
      setLngInput(lng.toFixed(6));
      // onChange will be called by ReverseGeocoder via handleReverseGeocodeResult
      // but we need to trigger it. We'll call onChange with partial data.
      onChange({ ...locationDataRef.current, ...loc });
    },
    [onChange]
  );

  const handleCoordInput = useCallback(
    (field: 'lat' | 'lng', raw: string) => {
      if (field === 'lat') setLatInput(raw);
      else setLngInput(raw);

      if (debounceRef.current) clearTimeout(debounceRef.current);

      debounceRef.current = setTimeout(() => {
        // Use refs to avoid stale closure — these always hold the latest values
        const lat = parseFloat(field === 'lat' ? raw : latInputRef.current);
        const lng = parseFloat(field === 'lng' ? raw : lngInputRef.current);
        if (!isNaN(lat) && !isNaN(lng)) {
          onChange({ ...locationDataRef.current, latitude: lat, longitude: lng });
        }
      }, 500);
    },
    // Empty deps — we use refs instead of closure values
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  // ── Handle map drag end — sync map center to coordinate inputs ──
  const handleDragEnd = useCallback(
    (event: { map: google.maps.Map }) => {
      const instance = event.map;
      if (instance) {
        const center = instance.getCenter();
        if (center) {
          const lat = center.lat();
          const lng = center.lng();
          setLatInput(lat.toFixed(6));
          setLngInput(lng.toFixed(6));
          onChange({ ...locationDataRef.current, latitude: lat, longitude: lng });
        }
      }
    },
    [onChange]
  );

  const handleMarkerDragEnd = useCallback(
    (event: google.maps.MapMouseEvent) => {
      if (event.latLng) {
        const lat = event.latLng.lat();
        const lng = event.latLng.lng();
        setLatInput(lat.toFixed(6));
        setLngInput(lng.toFixed(6));
        onChange({ ...locationDataRef.current, latitude: lat, longitude: lng });
      }
    },
    [onChange]
  );

  const currentPosition = useMemo(() => {
    if (!value) return null;
    return { lat: value.latitude, lng: value.longitude };
  }, [value?.latitude, value?.longitude]);

  // ── Map theme styles ──────────────────────────────────────────
  const currentStyles = useMemo(() => {
    if (mapTheme === 'dark') return DARK_MAP_STYLE;
    if (mapTheme === 'streets') return LIGHT_MAP_STYLE;
    // terrain and satellite use Google's native rendering — no custom styles
    return undefined;
  }, [mapTheme]);

  const currentMapTypeId = useMemo(() => {
    const MAP_TYPE_IDS: Record<MapTheme, google.maps.MapTypeId | undefined> = {
      streets: typeof google !== 'undefined' ? google.maps.MapTypeId.ROADMAP : 'roadmap' as google.maps.MapTypeId,
      terrain: typeof google !== 'undefined' ? google.maps.MapTypeId.TERRAIN : 'terrain' as google.maps.MapTypeId,
      satellite: typeof google !== 'undefined' ? google.maps.MapTypeId.SATELLITE : 'satellite' as google.maps.MapTypeId,
      dark: typeof google !== 'undefined' ? google.maps.MapTypeId.ROADMAP : 'roadmap' as google.maps.MapTypeId,
    };
    return MAP_TYPE_IDS[mapTheme];
  }, [mapTheme]);

  return (
    <APIProvider apiKey={apiKey}>
      <div className="space-y-4">
        {/* Map — 320px height, rounded-xl, fully interactive */}
        <div
          className="relative rounded-xl overflow-clip border border-secondary/40 shadow-warm-sm"
          style={{ height: '320px' }}
        >
          <Map
            gestureHandling="greedy"
            streetViewControl={false}
            mapTypeControl={false}
            fullscreenControl={false}
            mapId={mapId}
            style={{ width: '100%', height: '100%' }}
            defaultCenter={currentPosition ?? DEFAULT_CENTER}
            defaultZoom={currentPosition ? 10 : 3}
            scrollwheel={true}
            draggable={true}
            styles={currentStyles}
            mapTypeId={currentMapTypeId}
            onDragend={handleDragEnd}
          >
            <MapClickHandler onMapClick={handleMapClick} />
            <MapPanController
              lat={currentPosition?.lat ?? 0}
              lng={currentPosition?.lng ?? 0}
              zoom={currentPosition ? 10 : 3}
            />
            {currentPosition && (
              <AdvancedMarker
                position={currentPosition}
                draggable={true}
                onDragEnd={handleMarkerDragEnd}
              >
                <Pin
                  background={'#B8860B'}
                  borderColor={'#8B4513'}
                  glyphColor={'#FDFAF5'}
                />
              </AdvancedMarker>
            )}
            {currentPosition && (
              <ReverseGeocoder
                latitude={currentPosition.lat}
                longitude={currentPosition.lng}
                onResult={handleReverseGeocodeResult}
              />
            )}
          </Map>

          {/* Map theme/style selector — floating bottom-left */}
          <div ref={themeMenuRef} className="absolute bottom-3 left-3 z-30">
            <button
              onClick={() => setThemeMenuOpen((prev) => !prev)}
              className="h-9 w-9 rounded-full bg-background/95 backdrop-blur-sm border border-secondary/40 shadow-warm-md flex items-center justify-center hover:bg-accent transition-colors"
              aria-label="Change map style"
              title="Change map style"
            >
              <Layers className="h-4 w-4 text-foreground" />
            </button>

            {themeMenuOpen && (
              <div className="absolute bottom-11 left-0 bg-background/95 backdrop-blur-sm border border-secondary/40 rounded-xl shadow-warm-xl p-1.5 min-w-[150px]">
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
        </div>

        {/* Reverse geocode description */}
        {reverseGeocode && (
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-muted/50 border border-secondary/30">
            <MapPinIcon className="h-4 w-4 text-primary shrink-0" />
            <span className="text-sm text-foreground">{reverseGeocode}</span>
          </div>
        )}

        {/* Coordinate inputs — 2 columns */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Latitude</Label>
            <Input
              type="number"
              step="0.000001"
              value={latInput}
              onChange={(e) => handleCoordInput('lat', e.target.value)}
              className="text-sm font-mono"
              placeholder="40.7128"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Longitude</Label>
            <Input
              type="number"
              step="0.000001"
              value={lngInput}
              onChange={(e) => handleCoordInput('lng', e.target.value)}
              className="text-sm font-mono"
              placeholder="-74.0060"
            />
          </div>
        </div>

        {/* Editable location hierarchy fields */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Country</Label>
            <Input
              value={locationData.country}
              onChange={(e) => {
                const newData = { ...locationData, country: e.target.value };
                setLocationData(newData);
                if (value) onChange({ ...value, ...newData });
              }}
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Region</Label>
            <Input
              value={locationData.region}
              onChange={(e) => {
                const newData = { ...locationData, region: e.target.value };
                setLocationData(newData);
                if (value) onChange({ ...value, ...newData });
              }}
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">State / Province</Label>
            <Input
              value={locationData.state}
              onChange={(e) => {
                const newData = { ...locationData, state: e.target.value };
                setLocationData(newData);
                if (value) onChange({ ...value, ...newData });
              }}
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">City / Locality</Label>
            <Input
              value={locationData.city}
              onChange={(e) => {
                const newData = { ...locationData, city: e.target.value };
                setLocationData(newData);
                if (value) onChange({ ...value, ...newData });
              }}
            />
          </div>
        </div>
      </div>
    </APIProvider>
  );
}

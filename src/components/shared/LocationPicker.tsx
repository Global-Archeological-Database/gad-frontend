'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { APIProvider, Map, AdvancedMarker, Pin, useMap } from '@vis.gl/react-google-maps';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { MapPinIcon } from 'lucide-react';

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

function ReverseGeocoder({
  latitude,
  longitude,
  onResult,
}: {
  latitude: number;
  longitude: number;
  onResult: (data: Omit<LocationData, 'latitude' | 'longitude'>) => void;
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

          onResult({ country, state, city, region });
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

  // Sync inputs when value prop changes externally
  useEffect(() => {
    if (value) {
      setLatInput(value.latitude.toString());
      setLngInput(value.longitude.toString());
    }
  }, [value]);

  const handleReverseGeocodeResult = useCallback(
    (data: Omit<LocationData, 'latitude' | 'longitude'>) => {
      setLocationData(data);
      // Build a human-readable reverse geocode string
      const parts = [data.city, data.state, data.country].filter(Boolean);
      setReverseGeocode(parts.length > 0 ? parts.join(', ') : null);
      if (value) {
        onChange({ ...value, ...data });
      }
    },
    [value, onChange]
  );

  const handleMapClick = useCallback(
    (lat: number, lng: number) => {
      const loc = { latitude: lat, longitude: lng };
      setLatInput(lat.toFixed(6));
      setLngInput(lng.toFixed(6));
      // onChange will be called by ReverseGeocoder via handleReverseGeocodeResult
      // but we need to trigger it. We'll call onChange with partial data.
      onChange({ ...loc, ...locationData });
    },
    [locationData, onChange]
  );

  const handleCoordInput = useCallback(
    (field: 'lat' | 'lng', raw: string) => {
      if (field === 'lat') setLatInput(raw);
      else setLngInput(raw);

      if (debounceRef.current) clearTimeout(debounceRef.current);

      debounceRef.current = setTimeout(() => {
        const lat = parseFloat(field === 'lat' ? raw : latInput);
        const lng = parseFloat(field === 'lng' ? raw : lngInput);
        if (!isNaN(lat) && !isNaN(lng)) {
          onChange({ latitude: lat, longitude: lng, ...locationData });
        }
      }, 500);
    },
    [latInput, lngInput, locationData, onChange]
  );

  const currentPosition = value
    ? { lat: value.latitude, lng: value.longitude }
    : null;

  return (
    <APIProvider apiKey={apiKey}>
      <div className="space-y-4">
        {/* Map — 320px height, rounded-xl, fully interactive */}
        <div
          className="rounded-xl overflow-clip border border-secondary/40 shadow-warm-sm"
          style={{ height: '320px', touchAction: 'none' }}
          onWheel={(e) => e.stopPropagation()}
          onTouchMove={(e) => e.stopPropagation()}
        >
          <Map
            gestureHandling="greedy"
            streetViewControl={false}
            mapTypeControl={false}
            fullscreenControl={false}
            mapId={mapId}
            style={{ width: '100%', height: '100%' }}
            center={currentPosition ?? DEFAULT_CENTER}
            zoom={currentPosition ? 10 : 3}
            scrollwheel={true}
            draggable={true}
          >
            <MapClickHandler onMapClick={handleMapClick} />
            {currentPosition && (
              <AdvancedMarker position={currentPosition}>
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

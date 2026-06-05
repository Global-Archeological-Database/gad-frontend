'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { APIProvider, Map, AdvancedMarker, useMap } from '@vis.gl/react-google-maps';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

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
      <div className="space-y-3">
        {/* Map */}
        <div
          style={{ height: 250, width: '100%', borderRadius: 8, overflow: 'hidden' }}
          className="border border-border"
        >
          <Map
            defaultCenter={DEFAULT_CENTER}
            defaultZoom={3}
            gestureHandling="greedy"
            disableDefaultUI={false}
            mapTypeControl={false}
            streetViewControl={false}
            fullscreenControl={false}
            mapId={mapId}
            style={{ width: '100%', height: '100%' }}
            center={currentPosition ?? DEFAULT_CENTER}
            zoom={currentPosition ? 10 : 3}
          >
            <MapClickHandler onMapClick={handleMapClick} />
            {currentPosition && (
              <AdvancedMarker position={currentPosition} />
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

        {/* Coordinate inputs */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <Label htmlFor="loc-lat">Latitude</Label>
            <Input
              id="loc-lat"
              type="number"
              step="any"
              placeholder="e.g. 48.8566"
              value={latInput}
              onChange={(e) => handleCoordInput('lat', e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="loc-lng">Longitude</Label>
            <Input
              id="loc-lng"
              type="number"
              step="any"
              placeholder="e.g. 2.3522"
              value={lngInput}
              onChange={(e) => handleCoordInput('lng', e.target.value)}
            />
          </div>
        </div>

        {/* Read-only location fields */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <Label>Country</Label>
            <Input value={locationData.country} readOnly className="bg-muted/50" />
          </div>
          <div className="space-y-1">
            <Label>State</Label>
            <Input value={locationData.state} readOnly className="bg-muted/50" />
          </div>
          <div className="space-y-1">
            <Label>City</Label>
            <Input value={locationData.city} readOnly className="bg-muted/50" />
          </div>
          <div className="space-y-1">
            <Label>Region</Label>
            <Input value={locationData.region} readOnly className="bg-muted/50" />
          </div>
        </div>
      </div>
    </APIProvider>
  );
}

'use client';

import { AdvancedMarker } from '@vis.gl/react-google-maps';
import type { Artifact } from '@/types/artifact';

interface ArtifactMarkerProps {
  artifact: Artifact;
  onClick: () => void;
}

function getMarkerColor(age: string | null | undefined): string {
  // Try to parse the age string to determine era
  if (!age) return '#888780';
  const ageLower = age.toLowerCase();

  // Check for BCE/BC dates
  const bceMatch = ageLower.match(/(\d+)\s*(bce|bc)/);
  if (bceMatch) {
    const year = parseInt(bceMatch[1], 10);
    if (year > 1500) return '#B8860B'; // Before 500 CE (i.e., > 1500 BCE)
    return '#722F37'; // 500-1500 CE range
  }

  // Check for CE/AD dates
  const ceMatch = ageLower.match(/(\d+)\s*(ce|ad)/);
  if (ceMatch) {
    const year = parseInt(ceMatch[1], 10);
    if (year < 500) return '#B8860B';
    if (year < 1500) return '#722F37';
    if (year < 1900) return '#2D5A27';
    return '#4A6FA5';
  }

  // Check for century references (e.g., "12th century")
  const centuryMatch = ageLower.match(/(\d+)(st|nd|rd|th)\s*century/);
  if (centuryMatch) {
    const century = parseInt(centuryMatch[1], 10);
    const year = (century - 1) * 100;
    if (century <= 5) return '#B8860B';
    if (century <= 15) return '#722F37';
    if (century <= 19) return '#2D5A27';
    return '#4A6FA5';
  }

  // Check for millennia (e.g., "2nd millennium BCE")
  const millenniumMatch = ageLower.match(/(\d+)(st|nd|rd|th)\s*millennium/);
  if (millenniumMatch) {
    return '#B8860B'; // Millennia references are ancient
  }

  // Fallback: unknown
  return '#888780';
}

export default function ArtifactMarker({ artifact, onClick }: ArtifactMarkerProps) {
  // Backend stores coordinates at top level (latitude/longitude) and optionally in location.coordinates
  const lat = artifact.latitude ?? artifact.location?.coordinates?.latitude;
  const lng = artifact.longitude ?? artifact.location?.coordinates?.longitude;
  if (lat == null || lng == null) return null;

  const position = {
    lat,
    lng,
  };

  const color = getMarkerColor(artifact.age);

  return (
    <AdvancedMarker position={position} onClick={onClick}>
      <div
        className="marker-pin"
        style={{
          width: 12,
          height: 12,
          borderRadius: '50%',
          backgroundColor: color,
          border: '2px solid white',
          boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
          cursor: 'pointer',
          transition: 'transform 0.2s ease',
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLElement).style.transform = 'scale(1.4)';
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLElement).style.transform = 'scale(1)';
        }}
      />
    </AdvancedMarker>
  );
}

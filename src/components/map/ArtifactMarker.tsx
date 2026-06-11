'use client';

import { useRef, useEffect } from 'react';
import { AdvancedMarker } from '@vis.gl/react-google-maps';
import type { Artifact } from '@/types/artifact';
import { getAgeColor } from '@/lib/ageColor';

interface ArtifactMarkerProps {
  artifact: Artifact;
  onClick: () => void;
  isSelected?: boolean;
  isDimmed?: boolean;
}

function getMarkerElement(ageColor: string, isSelected: boolean): HTMLDivElement {
  const el = document.createElement('div');
  el.style.cssText = `
    width: ${isSelected ? '20px' : '16px'};
    height: ${isSelected ? '20px' : '16px'};
    border-radius: 50%;
    border: ${isSelected ? '2px' : '1.5px'} solid ${ageColor};
    background: white;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 200ms ease-out;
    box-shadow: ${isSelected ? `0 0 0 4px ${ageColor}30` : '0 1px 3px rgba(0,0,0,0.2)'};
  `;

  const inner = document.createElement('div');
  inner.style.cssText = `
    width: ${isSelected ? '10px' : '8px'};
    height: ${isSelected ? '10px' : '8px'};
    border-radius: 50%;
    background: ${ageColor};
    transition: all 200ms ease-out;
  `;

  el.appendChild(inner);
  return el;
}

export default function ArtifactMarker({ artifact, onClick, isSelected = false, isDimmed = false }: ArtifactMarkerProps) {
  // Backend stores coordinates at top level (latitude/longitude) and optionally in location.coordinates
  const lat = artifact.latitude ?? artifact.location?.coordinates?.latitude;
  const lng = artifact.longitude ?? artifact.location?.coordinates?.longitude;
  if (lat == null || lng == null) return null;

  const position = { lat, lng };
  const ageColor = getAgeColor(artifact.age);
  const containerRef = useRef<HTMLDivElement>(null);

  // Create/recreate the DOM element when isSelected or ageColor changes
  useEffect(() => {
    if (containerRef.current) {
      // Clear previous children
      containerRef.current.innerHTML = '';
      // Append the new layered marker element
      const markerEl = getMarkerElement(ageColor, isSelected);
      containerRef.current.appendChild(markerEl);
    }
  }, [isSelected, ageColor]);

  return (
    <AdvancedMarker position={position} onClick={onClick}>
      <div
        ref={containerRef}
        style={{
          opacity: isDimmed ? 0.3 : 1,
          transition: 'opacity 200ms ease-out',
        }}
        onMouseEnter={(e) => {
          const outerRing = e.currentTarget.firstElementChild as HTMLElement | null;
          if (outerRing) {
            outerRing.style.transform = 'scale(1.2)';
          }
        }}
        onMouseLeave={(e) => {
          const outerRing = e.currentTarget.firstElementChild as HTMLElement | null;
          if (outerRing) {
            outerRing.style.transform = 'scale(1)';
          }
        }}
      />
    </AdvancedMarker>
  );
}

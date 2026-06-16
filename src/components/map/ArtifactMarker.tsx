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

/**
 * Build a custom DOM element for the marker.
 * The marker uses the age color as a SOLID fill with a white border ring,
 * making it clearly visible against the warm/light map background.
 * Size is increased for better visibility and click target.
 */
function buildMarkerElement(ageColor: string, isSelected: boolean): HTMLDivElement {
  const size = isSelected ? 28 : 22;
  const borderWidth = isSelected ? 3 : 2.5;

  const el = document.createElement('div');
  el.style.cssText = `
    width: ${size}px;
    height: ${size}px;
    border-radius: 50%;
    background: ${ageColor};
    border: ${borderWidth}px solid white;
    box-shadow: ${
      isSelected
        ? `0 0 0 4px ${ageColor}60, 0 3px 10px rgba(0,0,0,0.5)`
        : '0 2px 6px rgba(0,0,0,0.35)'
    };
    cursor: pointer;
    transition: all 200ms ease-out;
    position: relative;
  `;

  // Add a subtle inner ring for depth
  el.style.setProperty('--inner-ring', `inset 0 0 0 1px ${ageColor}80`);
  el.style.boxShadow += `, inset 0 0 0 1px rgba(255,255,255,0.15)`;

  return el;
}

export default function ArtifactMarker({
  artifact,
  onClick,
  isSelected = false,
  isDimmed = false,
}: ArtifactMarkerProps) {
  // Backend stores coordinates at top level (latitude/longitude) and optionally in location.coordinates
  const lat = artifact.latitude ?? artifact.location?.coordinates?.latitude;
  const lng = artifact.longitude ?? artifact.location?.coordinates?.longitude;
  if (lat == null || lng == null) return null;

  const position = { lat, lng };
  const ageColor = getAgeColor(artifact.age);
  const containerRef = useRef<HTMLDivElement>(null);

  // Rebuild the DOM element when selection state or color changes
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.innerHTML = '';
      const markerEl = buildMarkerElement(ageColor, isSelected);
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
          const dot = e.currentTarget.firstElementChild as HTMLElement | null;
          if (dot) {
            dot.style.transform = 'scale(1.3)';
            dot.style.zIndex = '10';
          }
        }}
        onMouseLeave={(e) => {
          const dot = e.currentTarget.firstElementChild as HTMLElement | null;
          if (dot) {
            dot.style.transform = 'scale(1)';
            dot.style.zIndex = 'auto';
          }
        }}
      />
    </AdvancedMarker>
  );
}

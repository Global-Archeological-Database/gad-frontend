'use client';

import { InfoWindow } from '@vis.gl/react-google-maps';
import Image from 'next/image';
import type { Artifact } from '@/types/artifact';

interface ArtifactInfoWindowProps {
  artifact: Artifact;
  onClose: () => void;
  onViewDetails: () => void;
}

export default function ArtifactInfoWindow({
  artifact,
  onClose,
  onViewDetails,
}: ArtifactInfoWindowProps) {
  // Backend stores coordinates at top level (latitude/longitude) and optionally in location.coordinates
  const lat = artifact.latitude ?? artifact.location?.coordinates?.latitude;
  const lng = artifact.longitude ?? artifact.location?.coordinates?.longitude;
  if (lat == null || lng == null) return null;

  const position = {
    lat,
    lng,
  };

  return (
    <InfoWindow position={position} onCloseClick={onClose}>
      <div
        className="artifact-info-window"
        style={{
          maxWidth: 260,
          fontFamily: 'system-ui, sans-serif',
          color: '#1A1208',
        }}
      >
        {/* Thumbnail */}
        {artifact.thumbnail_url && (
          <div
            style={{
              position: 'relative',
              width: '100%',
              height: 120,
              borderRadius: 6,
              overflow: 'hidden',
              marginBottom: 8,
            }}
          >
            <Image
              src={artifact.thumbnail_url}
              alt={artifact.title}
              fill
              style={{ objectFit: 'cover' }}
              sizes="260px"
            />
          </div>
        )}

        {/* Title */}
        <h3
          style={{
            margin: 0,
            fontSize: 14,
            fontWeight: 600,
            lineHeight: 1.3,
            color: '#1A1208',
          }}
        >
          {artifact.title}
        </h3>

        {/* Cultural origin */}
        {artifact.cultural_origin && (
          <p
            style={{
              margin: '4px 0',
              fontSize: 12,
              color: '#722F37',
              fontStyle: 'italic',
            }}
          >
            {artifact.cultural_origin}
          </p>
        )}

        {/* Age */}
        {artifact.age && (
          <p
            style={{
              margin: '2px 0 8px',
              fontSize: 11,
              color: '#888780',
            }}
          >
            {artifact.age}
          </p>
        )}

        {/* Buttons */}
        <div style={{ display: 'flex', gap: 6 }}>
          <button
            onClick={onViewDetails}
            style={{
              flex: 1,
              padding: '6px 12px',
              fontSize: 12,
              fontWeight: 500,
              backgroundColor: '#B8860B',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: 4,
              cursor: 'pointer',
            }}
          >
            View Details
          </button>
          <button
            onClick={onClose}
            style={{
              padding: '6px 12px',
              fontSize: 12,
              fontWeight: 500,
              backgroundColor: 'transparent',
              color: '#888780',
              border: '1px solid #D4C5A9',
              borderRadius: 4,
              cursor: 'pointer',
            }}
          >
            Close
          </button>
        </div>
      </div>
    </InfoWindow>
  );
}

'use client';

import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { X } from 'lucide-react';
import { useArtifact } from '@/hooks/useArtifacts';
import { useAuthStore } from '@/store/authStore';

interface ArtifactDetailPanelProps {
  artifactId: string | null;
  onClose: () => void;
}

export default function ArtifactDetailPanel({
  artifactId,
  onClose,
}: ArtifactDetailPanelProps) {
  const { data: artifact, isLoading, isError } = useArtifact(artifactId);
  const user = useAuthStore((state) => state.user);

  return (
    <AnimatePresence>
      {artifactId && (
        <motion.div
          key="detail-panel"
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          style={{
            position: 'fixed',
            top: 64,
            right: 0,
            width: '100%',
            maxWidth: 480,
            height: 'calc(100vh - 64px)',
            backgroundColor: '#FDFAF5',
            borderLeft: '1px solid #D4C5A9',
            boxShadow: '-4px 0 24px rgba(0,0,0,0.1)',
            zIndex: 40,
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {/* Close button */}
          <button
            onClick={onClose}
            style={{
              position: 'absolute',
              top: 12,
              right: 12,
              width: 32,
              height: 32,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: 'rgba(0,0,0,0.05)',
              border: 'none',
              borderRadius: '50%',
              cursor: 'pointer',
              color: '#1A1208',
              zIndex: 1,
            }}
          >
            <X size={18} />
          </button>

          {/* Content */}
          {isLoading && (
            <div
              style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#888780',
                fontSize: 14,
              }}
            >
              Loading...
            </div>
          )}

          {isError && (
            <div
              style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#c0392b',
                fontSize: 14,
              }}
            >
              Failed to load artifact details.
            </div>
          )}

          {artifact && (
            <>
              {/* Full-size image */}
              {artifact.image_url && (
                <div
                  style={{
                    position: 'relative',
                    width: '100%',
                    height: 280,
                    flexShrink: 0,
                    backgroundColor: '#f0ebe3',
                  }}
                >
                  <Image
                    src={artifact.image_url}
                    alt={artifact.title}
                    fill
                    style={{ objectFit: 'cover' }}
                    sizes="(max-width: 480px) 100vw, 480px"
                    priority
                  />
                </div>
              )}

              {/* Metadata */}
              <div style={{ padding: 24, flex: 1, overflowY: 'auto' }}>
                <h2
                  style={{
                    margin: '0 0 4px',
                    fontSize: 22,
                    fontWeight: 700,
                    color: '#1A1208',
                  }}
                >
                  {artifact.title}
                </h2>

                {artifact.cultural_origin && (
                  <p
                    style={{
                      margin: '0 0 16px',
                      fontSize: 14,
                      color: '#722F37',
                      fontStyle: 'italic',
                    }}
                  >
                    {artifact.cultural_origin}
                  </p>
                )}

                <MetadataRow label="Age" value={artifact.age} />
                <MetadataRow label="Condition" value={artifact.condition} />
                <MetadataRow
                  label="Materials"
                  value={artifact.materials?.join(', ')}
                />
                <MetadataRow label="Tags" value={artifact.tags?.join(', ')} />

                {(artifact.location || artifact.country) && (
                  <>
                    <MetadataRow
                      label="Country"
                      value={artifact.location?.country || artifact.country || ''}
                    />
                    <MetadataRow
                      label="Region"
                      value={artifact.location?.region || ''}
                    />
                    <MetadataRow
                      label="Coordinates"
                      value={
                        artifact.location?.coordinates
                          ? `${artifact.location.coordinates.latitude.toFixed(4)}, ${artifact.location.coordinates.longitude.toFixed(4)}`
                          : artifact.latitude && artifact.longitude
                          ? `${artifact.latitude.toFixed(4)}, ${artifact.longitude.toFixed(4)}`
                          : ''
                      }
                    />
                  </>
                )}

                {artifact.description && (
                  <div style={{ marginTop: 16 }}>
                    <h4
                      style={{
                        margin: '0 0 4px',
                        fontSize: 13,
                        fontWeight: 600,
                        color: '#888780',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                      }}
                    >
                      Description
                    </h4>
                    <p
                      style={{
                        margin: 0,
                        fontSize: 14,
                        lineHeight: 1.6,
                        color: '#1A1208',
                      }}
                    >
                      {artifact.description}
                    </p>
                  </div>
                )}

                {/* AI Analysis section */}
                <div style={{ marginTop: 24, paddingTop: 16, borderTop: '1px solid #D4C5A9' }}>
                  <h4
                    style={{
                      margin: '0 0 8px',
                      fontSize: 13,
                      fontWeight: 600,
                      color: '#888780',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                    }}
                  >
                    AI Analysis
                  </h4>
                  {user ? (
                    <button
                      style={{
                        padding: '8px 16px',
                        fontSize: 13,
                        fontWeight: 500,
                        backgroundColor: '#B8860B',
                        color: '#FFFFFF',
                        border: 'none',
                        borderRadius: 6,
                        cursor: 'pointer',
                      }}
                    >
                      Analyze with AI
                    </button>
                  ) : (
                    <p
                      style={{
                        margin: 0,
                        fontSize: 13,
                        color: '#888780',
                      }}
                    >
                      Login to use AI features
                    </p>
                  )}
                </div>

                {/* Find Similar section */}
                <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid #D4C5A9' }}>
                  <h4
                    style={{
                      margin: '0 0 8px',
                      fontSize: 13,
                      fontWeight: 600,
                      color: '#888780',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                    }}
                  >
                    Find Similar
                  </h4>
                  {user ? (
                    <button
                      style={{
                        padding: '8px 16px',
                        fontSize: 13,
                        fontWeight: 500,
                        backgroundColor: '#B8860B',
                        color: '#FFFFFF',
                        border: 'none',
                        borderRadius: 6,
                        cursor: 'pointer',
                      }}
                    >
                      Find Similar Artifacts
                    </button>
                  ) : (
                    <p
                      style={{
                        margin: 0,
                        fontSize: 13,
                        color: '#888780',
                      }}
                    >
                      Login to use AI features
                    </p>
                  )}
                </div>
              </div>
            </>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function MetadataRow({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null;
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        padding: '6px 0',
        borderBottom: '1px solid #f0ebe3',
        fontSize: 13,
      }}
    >
      <span style={{ color: '#888780', fontWeight: 500 }}>{label}</span>
      <span style={{ color: '#1A1208', textAlign: 'right', maxWidth: '60%' }}>
        {value}
      </span>
    </div>
  );
}

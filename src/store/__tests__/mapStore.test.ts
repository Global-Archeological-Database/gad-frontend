import { describe, it, expect, beforeEach } from 'vitest';
import { useMapStore } from '@/store/mapStore';

describe('useMapStore', () => {
  beforeEach(() => {
    useMapStore.setState({
      selectedArtifactId: null,
      mapCenter: { lat: 20, lng: 0 },
      mapZoom: 3,
      isDetailPanelOpen: false,
    });
  });

  it('should initialize with default values', () => {
    const state = useMapStore.getState();
    expect(state.selectedArtifactId).toBeNull();
    expect(state.mapCenter).toEqual({ lat: 20, lng: 0 });
    expect(state.mapZoom).toBe(3);
    expect(state.isDetailPanelOpen).toBe(false);
  });

  it('should set selected artifact id', () => {
    useMapStore.getState().setSelectedArtifactId('artifact-1');
    expect(useMapStore.getState().selectedArtifactId).toBe('artifact-1');
  });

  it('should clear selected artifact id', () => {
    useMapStore.getState().setSelectedArtifactId('artifact-1');
    useMapStore.getState().setSelectedArtifactId(null);
    expect(useMapStore.getState().selectedArtifactId).toBeNull();
  });

  it('should set map center', () => {
    const newCenter = { lat: 51.5, lng: -0.12 };
    useMapStore.getState().setMapCenter(newCenter);
    expect(useMapStore.getState().mapCenter).toEqual(newCenter);
  });

  it('should set map zoom', () => {
    useMapStore.getState().setMapZoom(10);
    expect(useMapStore.getState().mapZoom).toBe(10);
  });

  it('should set detail panel open state', () => {
    useMapStore.getState().setIsDetailPanelOpen(true);
    expect(useMapStore.getState().isDetailPanelOpen).toBe(true);

    useMapStore.getState().setIsDetailPanelOpen(false);
    expect(useMapStore.getState().isDetailPanelOpen).toBe(false);
  });

  it('should preserve other state when updating a single field', () => {
    useMapStore.getState().setSelectedArtifactId('artifact-1');
    useMapStore.getState().setMapZoom(8);

    const state = useMapStore.getState();
    expect(state.selectedArtifactId).toBe('artifact-1');
    expect(state.mapZoom).toBe(8);
    expect(state.mapCenter).toEqual({ lat: 20, lng: 0 });
    expect(state.isDetailPanelOpen).toBe(false);
  });
});

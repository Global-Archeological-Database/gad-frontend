import { describe, it, expect, beforeEach } from 'vitest';
import { useUiStore } from '@/store/uiStore';

describe('useUiStore', () => {
  beforeEach(() => {
    useUiStore.setState({
      isChatOpen: false,
    });
  });

  it('should initialize with default values', () => {
    const state = useUiStore.getState();
    expect(state.isChatOpen).toBe(false);
  });

  it('should set chat open state', () => {
    useUiStore.getState().setIsChatOpen(true);
    expect(useUiStore.getState().isChatOpen).toBe(true);

    useUiStore.getState().setIsChatOpen(false);
    expect(useUiStore.getState().isChatOpen).toBe(false);
  });
});

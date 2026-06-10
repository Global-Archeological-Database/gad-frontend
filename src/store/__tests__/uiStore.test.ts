import { describe, it, expect, beforeEach } from 'vitest';
import { useUiStore } from '@/store/uiStore';

describe('useUiStore', () => {
  beforeEach(() => {
    useUiStore.setState({
      isChatOpen: false,
      isSubmitFormOpen: false,
    });
  });

  it('should initialize with default values', () => {
    const state = useUiStore.getState();
    expect(state.isChatOpen).toBe(false);
    expect(state.isSubmitFormOpen).toBe(false);
  });

  it('should set chat open state', () => {
    useUiStore.getState().setIsChatOpen(true);
    expect(useUiStore.getState().isChatOpen).toBe(true);

    useUiStore.getState().setIsChatOpen(false);
    expect(useUiStore.getState().isChatOpen).toBe(false);
  });

  it('should set submit form open state', () => {
    useUiStore.getState().setIsSubmitFormOpen(true);
    expect(useUiStore.getState().isSubmitFormOpen).toBe(true);

    useUiStore.getState().setIsSubmitFormOpen(false);
    expect(useUiStore.getState().isSubmitFormOpen).toBe(false);
  });

  it('should preserve other state when updating a single field', () => {
    useUiStore.getState().setIsChatOpen(true);

    const state = useUiStore.getState();
    expect(state.isChatOpen).toBe(true);
    expect(state.isSubmitFormOpen).toBe(false);
  });
});

'use client';

import { useEffect } from 'react';
import AuthGuard from '@/components/auth/AuthGuard';
import { useUiStore } from '@/store/uiStore';
import ArtifactSubmitForm from '@/components/artifacts/ArtifactSubmitForm';

export default function SubmitPage() {
  const setIsSubmitFormOpen = useUiStore((s) => s.setIsSubmitFormOpen);

  useEffect(() => {
    setIsSubmitFormOpen(true);
  }, [setIsSubmitFormOpen]);

  return (
    <AuthGuard>
      <ArtifactSubmitForm />
    </AuthGuard>
  );
}

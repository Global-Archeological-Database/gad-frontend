'use client';

import AuthGuard from '@/components/auth/AuthGuard';
import ArtifactSubmitForm from '@/components/artifacts/ArtifactSubmitForm';

export default function SubmitPage() {
  return (
    <AuthGuard>
      <ArtifactSubmitForm />
    </AuthGuard>
  );
}

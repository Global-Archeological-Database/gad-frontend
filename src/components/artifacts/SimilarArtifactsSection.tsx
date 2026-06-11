"use client";

import { ShuffleIcon } from "lucide-react";

interface SimilarArtifactsSectionProps {
  artifactId: string;
}

export default function SimilarArtifactsSection({ artifactId }: SimilarArtifactsSectionProps) {
  return (
    <div className="rounded-xl border border-secondary/40 bg-white shadow-warm-sm p-6 min-h-[100px]">
      <div className="flex items-center gap-2 mb-3">
        <ShuffleIcon className="h-5 w-5 text-primary" />
        <h2 className="font-display font-semibold text-sm uppercase tracking-wider text-muted-foreground">
          Similar Artifacts
        </h2>
      </div>
      <p className="text-sm text-muted-foreground">
        Sign in to discover artifacts similar to this one using AI-powered matching.
      </p>
    </div>
  );
}

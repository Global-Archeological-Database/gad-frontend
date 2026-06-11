"use client";

import { SparklesIcon } from "lucide-react";

interface ArtifactAISectionProps {
  artifactId: string;
}

export default function ArtifactAISection({ artifactId }: ArtifactAISectionProps) {
  return (
    <div className="rounded-xl border border-secondary/40 bg-white shadow-warm-sm p-6 min-h-[120px]">
      <div className="flex items-center gap-2 mb-3">
        <SparklesIcon className="h-5 w-5 text-primary" />
        <h2 className="font-display font-semibold text-sm uppercase tracking-wider text-muted-foreground">
          AI Analysis
        </h2>
      </div>
      <p className="text-sm text-muted-foreground">
        Sign in to analyze this artifact with AI — discover its historical context,
        cultural significance, and connections to other findings.
      </p>
    </div>
  );
}

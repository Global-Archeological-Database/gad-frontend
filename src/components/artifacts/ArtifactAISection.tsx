"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { SparklesIcon, AlertCircleIcon, InfoIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { aiApi } from "@/lib/api";

interface ArtifactAISectionProps {
  artifactId: string;
  existingAnalysis?: string | null;
}

/** Renders raw AI analysis text into structured sections. */
function AnalysisRenderer({ text }: { text: string }) {
  const sections = text.split(/^## /m).filter(Boolean);

  if (sections.length <= 1) {
    return <p className="text-sm leading-relaxed text-foreground">{text}</p>;
  }

  return (
    <div className="space-y-4">
      {sections.map((section, i) => {
        const firstNewline = section.indexOf("\n");
        const heading =
          firstNewline === -1 ? section : section.slice(0, firstNewline);
        const body =
          firstNewline === -1 ? "" : section.slice(firstNewline).trim();

        return (
          <div key={i}>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-primary pt-3 border-t border-secondary/30 first:pt-0 first:border-t-0">
              {heading.trim()}
            </h3>
            {body && (
              <p className="mt-1.5 text-sm leading-relaxed text-foreground">
                {body}
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
}

export default function ArtifactAISection({
  artifactId,
  existingAnalysis,
}: ArtifactAISectionProps) {
  const [analysis, setAnalysis] = useState<string | null>(
    existingAnalysis ?? null,
  );
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const runAnalysis = async () => {
    setIsAnalyzing(true);
    setError(null);
    try {
      const result = await aiApi.analyze(artifactId);
      setAnalysis(result.analysis);
    } catch (e) {
      setError("Analysis failed. Please try again.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  // ── Loading state ──────────────────────────────────────────────────
  if (isAnalyzing) {
    const shimmerWidths = [100, 85, 92, 70, 88];

    return (
      <section className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-secondary/40">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
              <SparklesIcon className="h-4 w-4 text-primary" />
            </div>
            <h2 className="font-display font-semibold text-sm uppercase tracking-wider text-muted-foreground">
              AI Analysis
            </h2>
          </div>
        </div>

        {/* Loading indicator */}
        <div className="rounded-xl border border-primary/20 bg-primary/4 p-6">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-6 h-6 rounded-full border-2 border-primary/30 border-t-primary animate-spin" />
            <span className="text-sm text-muted-foreground">
              Analyzing artifact...
            </span>
          </div>

          <div className="space-y-3">
            {shimmerWidths.map((width, i) => (
              <div
                key={i}
                className="h-3 rounded-full bg-gradient-to-r from-primary/10 via-primary/20 to-primary/10 bg-[length:200%_100%] animate-[shimmer_1.5s_linear_infinite]"
                style={{
                  width: `${width}%`,
                  animationDelay: `${i * 0.15}s`,
                }}
              />
            ))}
          </div>
        </div>
      </section>
    );
  }

  // ── Error state ────────────────────────────────────────────────────
  if (error) {
    return (
      <section className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-secondary/40">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
              <SparklesIcon className="h-4 w-4 text-primary" />
            </div>
            <h2 className="font-display font-semibold text-sm uppercase tracking-wider text-muted-foreground">
              AI Analysis
            </h2>
          </div>
        </div>

        {/* Error card */}
        <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-5 flex items-start gap-3">
          <AlertCircleIcon className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-destructive">Error</p>
            <p className="text-sm text-destructive/80 mt-0.5">{error}</p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={runAnalysis}
            className="shrink-0"
          >
            Retry
          </Button>
        </div>
      </section>
    );
  }

  // ── Success state (analysis exists) ────────────────────────────────
  if (analysis) {
    return (
      <section className="space-y-4">
        {/* Header with Re-analyze button */}
        <div className="flex items-center justify-between pb-3 border-b border-secondary/40">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
              <SparklesIcon className="h-4 w-4 text-primary" />
            </div>
            <h2 className="font-display font-semibold text-sm uppercase tracking-wider text-muted-foreground">
              AI Analysis
            </h2>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={runAnalysis}
            className="gap-1.5"
          >
            <SparklesIcon className="h-3.5 w-3.5" />
            Re-analyze
          </Button>
        </div>

        {/* Analysis content */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="rounded-xl border border-secondary/40 bg-white shadow-warm-xs overflow-hidden"
        >
          <div className="p-5 prose-archaeological">
            <AnalysisRenderer text={analysis} />
          </div>
        </motion.div>

        {/* Footer disclaimer */}
        <div className="flex items-start gap-2 text-xs text-muted-foreground/70">
          <InfoIcon className="h-3.5 w-3.5 shrink-0 mt-0.5" />
          <p>
            This analysis was generated by Gemini AI and should be verified by a
            qualified archaeologist for academic purposes.
          </p>
        </div>
      </section>
    );
  }

  // ── Empty / Dormant state (no analysis, not loading, no error) ─────
  return (
    <section className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-secondary/40">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
            <SparklesIcon className="h-4 w-4 text-primary" />
          </div>
          <h2 className="font-display font-semibold text-sm uppercase tracking-wider text-muted-foreground">
            AI Analysis
          </h2>
        </div>
      </div>

      {/* Empty state card */}
      <div className="rounded-xl border-2 border-dashed border-secondary/30 bg-white p-8 flex flex-col items-center text-center gap-4">
        <div className="w-12 h-12 rounded-full bg-primary/5 flex items-center justify-center">
          <SparklesIcon className="h-6 w-6 text-primary/60" />
        </div>
        <p className="text-sm text-muted-foreground max-w-sm">
          Get an expert AI analysis of this artifact's historical context,
          materials, and cultural significance.
        </p>
        <Button
          onClick={runAnalysis}
          className="bg-primary hover:bg-primary/90 shadow-warm-sm hover:shadow-golden transition-all gap-2"
        >
          <SparklesIcon className="h-4 w-4" />
          Analyze with AI
        </Button>
      </div>
    </section>
  );
}

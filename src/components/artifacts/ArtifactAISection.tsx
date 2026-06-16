"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { SparklesIcon, AlertCircleIcon, InfoIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { aiApi } from "@/lib/api";
import { formatAIResponse } from "@/lib/formatAIResponse";

interface ArtifactAISectionProps {
  artifactId: string;
  existingAnalysis?: string | null;
}

/** Renders AI analysis text into structured sections with proper formatting. */
function AnalysisRenderer({ text }: { text: string }) {
  // First clean the text — strip all markdown symbols
  const cleaned = formatAIResponse(text);

  // Split into sections by detecting "Heading:" pattern or blank lines
  const sections = cleaned.split(/\n\n+/);

  if (sections.length <= 1) {
    return <p className="text-sm leading-relaxed text-foreground">{cleaned}</p>;
  }

  return (
    <div className="space-y-4">
      {sections.map((section, idx) => {
        const lines = section.split('\n');
        const firstLine = lines[0];
        // Check if first line is a heading (ends with colon and is reasonably short)
        const isHeading = firstLine.endsWith(':') && firstLine.length < 60;

        if (isHeading) {
          return (
            <div key={idx}>
              <h4 className="font-display font-semibold text-sm uppercase tracking-wider text-primary mb-1.5">
                {firstLine.replace(/:$/, '')}
              </h4>
              <p className="text-sm text-foreground leading-relaxed prose-archaeological">
                {lines.slice(1).join('\n').trim()}
              </p>
            </div>
          );
        }

        return (
          <p key={idx} className="text-sm text-foreground leading-relaxed">
            {section}
          </p>
        );
      })}
    </div>
  );
}

const ANALYSIS_STAGES = [
  { label: 'Reading artifact data...', duration: 800 },
  { label: 'Examining material composition...', duration: 1500 },
  { label: 'Researching historical context...', duration: 2000 },
  { label: 'Preparing analysis...', duration: 1000 },
];

export default function ArtifactAISection({
  artifactId,
  existingAnalysis,
}: ArtifactAISectionProps) {
  const [analysis, setAnalysis] = useState<string | null>(
    existingAnalysis ?? null,
  );
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stageIndex, setStageIndex] = useState(0);

  useEffect(() => {
    if (!isAnalyzing) {
      setStageIndex(0);
      return;
    }

    let cumulative = 0;
    const timers = ANALYSIS_STAGES.map((stage, i) => {
      cumulative += stage.duration;
      return setTimeout(() => setStageIndex(i), cumulative);
    });

    return () => timers.forEach(clearTimeout);
  }, [isAnalyzing]);

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
            <p className="text-sm text-[#8B7355] animate-pulse">
              {ANALYSIS_STAGES[stageIndex]?.label || 'Almost done...'}
            </p>
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
          className="rounded-xl border border-secondary/40 bg-card shadow-warm-xs overflow-hidden"
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
      <div className="rounded-xl border-2 border-dashed border-secondary/30 bg-card p-8 flex flex-col items-center text-center gap-4">
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

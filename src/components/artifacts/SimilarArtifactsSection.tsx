"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import { SparklesIcon, Loader2Icon, DatabaseIcon, SearchXIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { aiApi } from "@/lib/api";
import { getAgeColor } from "@/lib/ageColor";
import { toast } from "sonner";
import type { Artifact } from "@/types/artifact";

interface SimilarArtifactsSectionProps {
  artifactId: string;
}

interface FindSimilarResponse {
  similar: Artifact[];
  message?: string;
  hint?: string;
}

export default function SimilarArtifactsSection({ artifactId }: SimilarArtifactsSectionProps) {
  const [similar, setSimilar] = useState<Artifact[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [statusHint, setStatusHint] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  const findSimilar = async () => {
    setIsLoading(true);
    setStatusMessage(null);
    setStatusHint(null);
    setHasSearched(true);
    try {
      const result: FindSimilarResponse = await aiApi.findSimilar(artifactId);
      
      // Handle not_enough_data message from backend
      if (result.message === 'not_enough_data') {
        setStatusMessage('not_enough_data');
        setStatusHint(result.hint || 'The database needs more artifacts to find similarities.');
        setSimilar([]);
        return;
      }
      
      // Handle parse_error
      if (result.message === 'parse_error') {
        toast.error('We couldn\'t find similar artifacts right now. The AI service returned an unexpected response. Please try again.');
        setSimilar([]);
        return;
      }
      
      setSimilar(result.similar);
      
      // If no similar found but not an error state
      if (result.similar.length === 0) {
        toast.error('We couldn\'t find similar artifacts right now. This may be because the database doesn\'t have enough related artifacts yet. Try again as the collection grows.');
      }
    } catch (e) {
      toast.error('We could not find similar artifacts right now. This may be because there are not enough related artifacts in the database yet.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <section className="space-y-4">
      {/* Section Header */}
      <div className="flex items-center justify-between pb-3 border-b border-secondary/40">
        <h2 className="font-display text-xl font-semibold">Similar Artifacts</h2>
        <Button
          variant="outline"
          size="sm"
          onClick={findSimilar}
          disabled={isLoading}
          className="border-primary/30 text-primary hover:bg-primary/5 gap-2"
        >
          {isLoading ? (
            <Loader2Icon className="h-3.5 w-3.5 animate-spin text-primary" />
          ) : (
            <SparklesIcon className="h-3.5 w-3.5" />
          )}
          Find Similar
        </Button>
      </div>

      {/* Empty / Initial State — before any search */}
      {!hasSearched && similar.length === 0 && !isLoading && !statusMessage && (
        <div className="flex flex-col items-center py-8 text-center">
          <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center mb-4 text-muted-foreground/40">
            <SparklesIcon className="h-7 w-7" />
          </div>
          <h3 className="font-display text-base font-semibold text-foreground mb-1">
            Discover similar artifacts
          </h3>
          <p className="text-sm text-muted-foreground max-w-xs">
            Click &ldquo;Find Similar&rdquo; to discover related artifacts using AI
          </p>
        </div>
      )}

      {/* Loading State */}
      {isLoading && similar.length === 0 && !statusMessage && (
        <div className="flex flex-col items-center py-8 text-center">
          <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center mb-4 text-muted-foreground/40">
            <Loader2Icon className="h-7 w-7 animate-spin" />
          </div>
          <p className="text-sm text-muted-foreground">Searching for similar artifacts...</p>
        </div>
      )}

      {/* Not Enough Data State */}
      {statusMessage === 'not_enough_data' && !isLoading && (
        <div className="flex flex-col items-center py-8 text-center">
          <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center mb-4 text-muted-foreground/40">
            <DatabaseIcon className="h-7 w-7" />
          </div>
          <h3 className="font-display text-base font-semibold text-foreground mb-1">
            More artifacts needed
          </h3>
          <p className="text-sm text-muted-foreground max-w-xs mb-4">
            The database needs more artifacts to find similarities. Try again as the collection grows.
          </p>
          <Link
            href="/submit"
            className="inline-flex items-center justify-center rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 h-8 gap-1.5 px-2.5 text-sm font-medium whitespace-nowrap transition-all shadow-warm-sm"
          >
            Contribute an artifact
          </Link>
        </div>
      )}

      {/* Zero Results State — search completed but no similar found */}
      {hasSearched && similar.length === 0 && !isLoading && !statusMessage && (
        <div className="flex flex-col items-center py-8 text-center">
          <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center mb-4 text-muted-foreground/40">
            <SearchXIcon className="h-7 w-7" />
          </div>
          <h3 className="font-display text-base font-semibold text-foreground mb-1">
            No similar artifacts found
          </h3>
          <p className="text-sm text-muted-foreground max-w-xs">
            No related artifacts could be found for this piece. Try again as the collection grows.
          </p>
        </div>
      )}

      {/* Populated State */}
      {similar.length > 0 && (
        <div className="flex gap-3 overflow-x-auto pb-2 no-scrollbar">
          {similar.map((artifact, idx) => (
            <motion.div
              key={artifact.id}
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.08 }}
              className="flex-shrink-0 w-28"
            >
              <Link href={`/artifacts/${artifact.id}`}>
                <div className="rounded-lg overflow-hidden border border-secondary/40 hover:border-primary/30 hover:shadow-warm-sm card-hover">
                  <div className="aspect-square bg-muted overflow-hidden">
                    <Image
                      src={artifact.thumbnail_url || artifact.image_url || ""}
                      alt={artifact.title}
                      width={112}
                      height={112}
                      className="object-cover w-full h-full image-blur-load"
                    />
                  </div>
                  <div className="p-1.5">
                    <p className="text-[10px] font-medium text-foreground line-clamp-2 leading-tight">
                      {artifact.title}
                    </p>
                    <div className="flex items-center gap-1 mt-1">
                      <div
                        className="h-1.5 w-1.5 rounded-full"
                        style={{ backgroundColor: getAgeColor(artifact.age) }}
                      />
                      <span className="text-[9px] text-muted-foreground">
                        {artifact.age}
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      )}
    </section>
  );
}

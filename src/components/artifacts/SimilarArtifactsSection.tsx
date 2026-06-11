"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import { SparklesIcon, Loader2Icon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { aiApi } from "@/lib/api";
import { getAgeColor } from "@/lib/ageColor";
import { toast } from "sonner";
import type { Artifact } from "@/types/artifact";

interface SimilarArtifactsSectionProps {
  artifactId: string;
}

export default function SimilarArtifactsSection({ artifactId }: SimilarArtifactsSectionProps) {
  const [similar, setSimilar] = useState<Artifact[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const findSimilar = async () => {
    setIsLoading(true);
    try {
      const result = await aiApi.findSimilar(artifactId);
      setSimilar(result.similar);
    } catch (e) {
      toast.error("Could not find similar artifacts");
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

      {/* Empty / Initial State */}
      {similar.length === 0 && !isLoading && (
        <p className="text-sm text-muted-foreground text-center py-8">
          Click "Find Similar" to discover related artifacts using AI
        </p>
      )}

      {/* Loading State (shown alongside empty state while loading) */}
      {isLoading && similar.length === 0 && (
        <p className="text-sm text-muted-foreground text-center py-8">
          Searching for similar artifacts...
        </p>
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

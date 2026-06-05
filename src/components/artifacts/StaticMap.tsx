"use client";

import { useState } from "react";

interface StaticMapProps {
  src: string;
  alt: string;
}

export default function StaticMap({ src, alt }: StaticMapProps) {
  const [hidden, setHidden] = useState(false);

  if (hidden) return null;

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      className="w-full h-auto"
      style={{ maxHeight: 200, objectFit: "cover" }}
      onError={() => setHidden(true)}
    />
  );
}

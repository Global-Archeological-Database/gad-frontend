"use client";

import { useState } from "react";

interface StaticMapProps {
  lat: number;
  lng: number;
  className?: string;
}

export default function StaticMap({ lat, lng, className }: StaticMapProps) {
  const [hidden, setHidden] = useState(false);
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  if (!apiKey || hidden) return null;

  const src = `https://maps.googleapis.com/maps/api/staticmap?center=${lat},${lng}&zoom=14&size=600x300&markers=${lat},${lng}&key=${apiKey}`;

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={`Map showing artifact location at ${lat}, ${lng}`}
      loading="lazy"
      className={className}
      onError={() => setHidden(true)}
    />
  );
}

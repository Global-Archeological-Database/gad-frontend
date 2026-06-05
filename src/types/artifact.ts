export interface ArtifactLocation {
  coordinates: {
    latitude: number;
    longitude: number;
  };
  country: string;
  state: string;
  city: string;
  region: string;
}

export interface Artifact {
  id: string;
  title: string;
  description: string;
  age: string;
  materials: string[];
  cultural_origin: string;
  condition: 'Excellent' | 'Good' | 'Fair' | 'Poor' | 'Fragmentary';
  tags: string[];
  image_url: string | null;
  model_url: string | null;
  thumbnail_url: string | null;
  is_3d: boolean;
  /** Backend stores location fields both at top level and in nested location object */
  location: ArtifactLocation | null;
  /** Top-level fields stored by backend (mirrored from location for querying) */
  country?: string;
  latitude?: number;
  longitude?: number;
  uploader_id: string;
  uploader_email: string;
  uploader_name: string | null;
  created_at: string;
  updated_at: string;
  view_count: number;
  ai_analysis: string | null;
  ai_analysis_timestamp: string | null;
}

export interface ArtifactListResponse {
  artifacts: Artifact[];
  count: number;
  nextPageToken: string | null;
}

export type CreateArtifactPayload = Omit<
  Artifact,
  | 'id'
  | 'uploader_id'
  | 'uploader_email'
  | 'created_at'
  | 'updated_at'
  | 'view_count'
  | 'ai_analysis'
  | 'ai_analysis_timestamp'
>;

export type UpdateArtifactPayload = Partial<
  Pick<
    Artifact,
    | 'title'
    | 'description'
    | 'age'
    | 'materials'
    | 'cultural_origin'
    | 'condition'
    | 'tags'
    | 'location'
    | 'image_url'
    | 'model_url'
    | 'thumbnail_url'
    | 'is_3d'
  >
>;

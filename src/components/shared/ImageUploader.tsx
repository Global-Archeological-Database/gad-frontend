'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { UploadCloudIcon, X, FileIcon } from 'lucide-react';
import { toast } from 'sonner';
import { artifactsApi } from '@/lib/api';
import { cn } from '@/lib/utils';

interface ImageUploaderProps {
  artifactId: string | null;
  fileType: 'image' | 'model';
  onUploadComplete: (publicUrl: string) => void;
}

const ACCEPTED_TYPES = {
  image: 'image/jpeg,image/png,image/webp,image/gif',
  model: '.glb,.gltf,model/gltf-binary',
} as const;

const MAX_FILE_SIZE_IMAGE = 50 * 1024 * 1024; // 50MB
const MAX_FILE_SIZE_MODEL = 200 * 1024 * 1024; // 200MB

export default function ImageUploader({
  artifactId,
  fileType,
  onUploadComplete,
}: ImageUploaderProps) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const isImage = fileType === 'image';
  const maxSize = isImage ? MAX_FILE_SIZE_IMAGE : MAX_FILE_SIZE_MODEL;

  // Generate preview for images
  useEffect(() => {
    if (!file) {
      setPreview(null);
      return;
    }
    if (isImage) {
      const url = URL.createObjectURL(file);
      setPreview(url);
      return () => URL.revokeObjectURL(url);
    }
    setPreview(null);
  }, [file, isImage]);

  const validateFile = useCallback(
    (f: File): string | null => {
      if (f.size > maxSize) {
        const mb = maxSize / 1024 / 1024;
        return `File size exceeds ${mb}MB limit.`;
      }
      if (isImage) {
        const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
        if (!allowed.includes(f.type)) {
          return 'Invalid image type. Accepted: JPG, PNG, WebP, GIF.';
        }
      } else {
        const allowedExts = ['.glb', '.gltf'];
        const ext = '.' + f.name.split('.').pop()?.toLowerCase();
        if (!allowedExts.includes(ext) && f.type !== 'model/gltf-binary') {
          return 'Invalid model type. Accepted: .glb, .gltf';
        }
      }
      return null;
    },
    [isImage, maxSize]
  );

  const handleFile = useCallback(
    (f: File) => {
      const validationError = validateFile(f);
      if (validationError) {
        setError(validationError);
        toast.error(validationError);
        return;
      }
      setError(null);
      setFile(f);
      setProgress(0);
    },
    [validateFile]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);
      const droppedFile = e.dataTransfer.files[0];
      if (droppedFile) handleFile(droppedFile);
    },
    [handleFile]
  );

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const selectedFile = e.target.files?.[0];
      if (selectedFile) handleFile(selectedFile);
    },
    [handleFile]
  );

  const uploadFile = useCallback(async () => {
    if (!file) return;
    if (!artifactId) return;

    setUploading(true);
    setError(null);

    try {
      const { uploadUrl, publicUrl } = await artifactsApi.getUploadUrl(
        artifactId,
        file.name,
        file.type
      );

      // Upload to signed URL with progress tracking
      const xhr = new XMLHttpRequest();
      xhr.open('PUT', uploadUrl, true);
      xhr.setRequestHeader('Content-Type', file.type);

      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          setProgress(Math.round((event.loaded / event.total) * 100));
        }
      };

      await new Promise<void>((resolve, reject) => {
        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve();
          } else {
            reject(new Error(`Upload failed with status ${xhr.status}`));
          }
        };
        xhr.onerror = () => reject(new Error('Network error during upload. Please check your connection.'));
        xhr.send(file);
      });

      onUploadComplete(publicUrl);
      toast.success(`${isImage ? 'Image' : '3D Model'} uploaded successfully`);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Upload failed. Please try again.';
      setError(message);
      toast.error(message);
    } finally {
      setUploading(false);
    }
  }, [file, artifactId, onUploadComplete, isImage]);

  // Auto-upload when artifactId becomes available
  useEffect(() => {
    if (artifactId && file && !uploading) {
      uploadFile();
    }
  }, [artifactId, file, uploading, uploadFile]);

  const clearFile = () => {
    setFile(null);
    setPreview(null);
    setProgress(0);
    setError(null);
    if (inputRef.current) inputRef.current.value = '';
  };

  const hasFile = file !== null;

  return (
    <div className="space-y-2">
      {/* Upload zone */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragOver(true);
        }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={handleDrop}
        onClick={() => !hasFile && !uploading && inputRef.current?.click()}
        className={cn(
          'rounded-xl border-2 border-dashed p-6 text-center transition-all duration-200',
          isDragOver && 'border-primary bg-primary/5 scale-[1.01]',
          hasFile && !uploading && 'border-primary/40 bg-primary/5',
          !isDragOver && !hasFile && 'border-secondary hover:border-secondary-foreground/30 cursor-pointer'
        )}
      >
        {uploading ? (
          /* Circular SVG progress indicator */
          <div className="flex flex-col items-center gap-3">
            <svg className="w-12 h-12 -rotate-90" viewBox="0 0 48 48">
              <circle
                cx="24" cy="24" r="20"
                fill="none" stroke="#F0EBE0"
                strokeWidth="3"
              />
              <circle
                cx="24" cy="24" r="20"
                fill="none" stroke="#B8860B"
                strokeWidth="3"
                strokeLinecap="round"
                strokeDasharray={`${2 * Math.PI * 20}`}
                strokeDashoffset={`${2 * Math.PI * 20 * (1 - progress / 100)}`}
                style={{ transition: 'stroke-dashoffset 0.3s ease' }}
              />
            </svg>
            <span className="text-sm font-medium text-foreground">{progress}%</span>
            <p className="text-xs text-muted-foreground">{file?.name}</p>
          </div>
        ) : hasFile ? (
          /* Preview: thumbnail + filename + size + X button */
          <div className="flex w-full items-center gap-3 text-left">
            {isImage && preview ? (
              <div className="relative size-16 shrink-0 overflow-hidden rounded-md">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={preview}
                  alt="Preview"
                  className="size-full object-cover"
                />
              </div>
            ) : (
              <div className="flex size-16 shrink-0 items-center justify-center rounded-md bg-muted">
                <FileIcon className="size-8 text-muted-foreground" />
              </div>
            )}
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{file?.name}</p>
              <p className="text-xs text-muted-foreground">
                {file ? (file.size / 1024 / 1024).toFixed(2) : '0'} MB
              </p>
            </div>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                clearFile();
              }}
              className="shrink-0 rounded-full p-1 hover:bg-muted transition-colors"
            >
              <X size={16} />
            </button>
          </div>
        ) : (
          /* Empty state */
          <>
            <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center mx-auto mb-3">
              <UploadCloudIcon className="h-6 w-6 text-muted-foreground" />
            </div>
            <p className="text-sm text-foreground font-medium">
              {isImage
                ? 'Drop artifact photograph here'
                : 'Drop 3D model here'}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {isImage ? 'or click to browse' : 'GLB or GLTF format'}
            </p>
          </>
        )}

        <input
          ref={inputRef}
          type="file"
          accept={ACCEPTED_TYPES[fileType]}
          onChange={handleInputChange}
          className="hidden"
        />
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 rounded-md bg-destructive/10 px-3 py-2 text-xs text-destructive">
          <span>{error}</span>
          <button
            type="button"
            onClick={() => setError(null)}
            className="ml-auto shrink-0 rounded-full p-0.5 hover:bg-destructive/20"
          >
            <X size={12} />
          </button>
        </div>
      )}
    </div>
  );
}

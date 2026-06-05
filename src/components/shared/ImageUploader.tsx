'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { Upload, FileIcon, X, ImageIcon } from 'lucide-react';
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

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

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

  // Generate preview for images
  useEffect(() => {
    if (!file) {
      setPreview(null);
      return;
    }
    if (fileType === 'image') {
      const url = URL.createObjectURL(file);
      setPreview(url);
      return () => URL.revokeObjectURL(url);
    }
    setPreview(null);
  }, [file, fileType]);

  const validateFile = useCallback(
    (f: File): string | null => {
      if (f.size > MAX_FILE_SIZE) {
        return 'File size exceeds 50MB limit.';
      }
      if (fileType === 'image') {
        const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
        if (!allowed.includes(f.type)) {
          return 'Invalid image type. Accepted: JPEG, PNG, WebP, GIF.';
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
    [fileType]
  );

  const handleFile = useCallback(
    (f: File) => {
      const validationError = validateFile(f);
      if (validationError) {
        setError(validationError);
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
    if (!artifactId) return; // Wait for artifact to be created

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
        xhr.onerror = () => reject(new Error('Upload failed'));
        xhr.send(file);
      });

      onUploadComplete(publicUrl);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Upload failed. Please try again.'
      );
    } finally {
      setUploading(false);
    }
  }, [file, artifactId, onUploadComplete]);

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

  const isImage = fileType === 'image';

  return (
    <div className="space-y-2">
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragOver(true);
        }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={handleDrop}
        onClick={() => !file && inputRef.current?.click()}
        className={cn(
          'relative flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed p-6 transition-colors',
          isDragOver
            ? 'border-primary bg-primary/5'
            : 'border-border hover:border-muted-foreground/50',
          file && 'pointer-events-none'
        )}
      >
        {!file ? (
          <>
            {isImage ? (
              <ImageIcon className="mb-2 size-8 text-muted-foreground" />
            ) : (
              <Upload className="mb-2 size-8 text-muted-foreground" />
            )}
            <p className="text-sm text-muted-foreground">
              {isImage
                ? 'Drop an image here or click to browse'
                : 'Drop a 3D model here or click to browse'}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {isImage
                ? 'JPEG, PNG, WebP, GIF — max 50MB'
                : 'GLB, GLTF — max 50MB'}
            </p>
          </>
        ) : (
          <div className="flex w-full items-center gap-3">
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
              <p className="truncate text-sm font-medium">{file.name}</p>
              <p className="text-xs text-muted-foreground">
                {(file.size / 1024 / 1024).toFixed(2)} MB
              </p>
            </div>
            {!uploading && (
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
            )}
          </div>
        )}

        <input
          ref={inputRef}
          type="file"
          accept={ACCEPTED_TYPES[fileType]}
          onChange={handleInputChange}
          className="hidden"
        />
      </div>

      {/* Progress bar */}
      {uploading && (
        <div className="space-y-1">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Uploading...</span>
            <span>{progress}%</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

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

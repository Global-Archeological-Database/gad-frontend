'use client';

import { useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod/v4';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { useUiStore } from '@/store/uiStore';
import { artifactsApi } from '@/lib/api';
import { artifactKeys } from '@/hooks/useArtifacts';
import LocationPicker from '@/components/shared/LocationPicker';
import type { LocationData } from '@/components/shared/LocationPicker';
import ImageUploader from '@/components/shared/ImageUploader';
import TagInput from '@/components/shared/TagInput';

/* ─── Zod schema for Step 2 ─── */
const artifactDetailsSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title must be 200 characters or fewer'),
  description: z.string().min(1, 'Description is required').max(5000, 'Description must be 5000 characters or fewer'),
  cultural_origin: z.string().optional(),
  age: z.string().optional(),
  condition: z.enum(['Excellent', 'Good', 'Fair', 'Poor', 'Fragmentary']).optional(),
  materials: z.array(z.string()).max(10).optional(),
  tags: z.array(z.string()).max(20).optional(),
});

type ArtifactDetailsValues = z.infer<typeof artifactDetailsSchema>;

/* ─── Step indicator ─── */
function StepIndicator({
  current,
  steps,
}: {
  current: number;
  steps: { label: string; isValid: boolean }[];
}) {
  return (
    <div className="flex items-center gap-2">
      {steps.map((step, i) => {
        const stepNum = i + 1;
        const isActive = stepNum === current;
        const isCompleted = stepNum < current;
        return (
          <div key={step.label} className="flex items-center gap-2">
            <div
              className={`flex size-7 items-center justify-center rounded-full text-xs font-semibold transition-colors ${
                isActive
                  ? 'bg-[#B8860B] text-white'
                  : isCompleted
                  ? 'bg-[#B8860B]/20 text-[#B8860B]'
                  : 'bg-muted text-muted-foreground'
              }`}
            >
              {isCompleted ? '✓' : stepNum}
            </div>
            <span
              className={`text-xs font-medium ${
                isActive ? 'text-foreground' : 'text-muted-foreground'
              }`}
            >
              {step.label}
            </span>
            {i < steps.length - 1 && (
              <Separator
                orientation="horizontal"
                className={`w-6 ${
                  isCompleted ? 'bg-[#B8860B]/40' : 'bg-border'
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ─── Main form ─── */
export default function ArtifactSubmitForm() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const isOpen = useUiStore((s) => s.isSubmitFormOpen);
  const setIsOpen = useUiStore((s) => s.setIsSubmitFormOpen);

  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);

  // Step 1 — Location
  const [location, setLocation] = useState<LocationData | null>(null);

  // Step 2 — Details (react-hook-form)
  const {
    register,
    handleSubmit: handleFormSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<ArtifactDetailsValues>({
    resolver: zodResolver(artifactDetailsSchema),
    defaultValues: {
      title: '',
      description: '',
      cultural_origin: '',
      age: '',
      condition: undefined,
      materials: [],
      tags: [],
    },
  });

  const titleValue = watch('title');
  const descriptionValue = watch('description');
  const materialsValue = watch('materials') ?? [];
  const tagsValue = watch('tags') ?? [];

  // Step 3 — Media
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [modelUrl, setModelUrl] = useState<string | null>(null);
  const [createdArtifactId, setCreatedArtifactId] = useState<string | null>(null);

  // Pending files to upload after artifact creation
  const pendingImageRef = useRef<(() => void) | null>(null);
  const pendingModelRef = useRef<(() => void) | null>(null);

  const locationIsValid = location !== null && !isNaN(location.latitude) && !isNaN(location.longitude);

  const steps = [
    { label: 'Location', isValid: locationIsValid },
    { label: 'Details', isValid: true }, // validated by react-hook-form
    { label: 'Media', isValid: imageUrl !== null || modelUrl !== null },
  ];

  const canProceedFromStep1 = locationIsValid;

  const handleNext = () => {
    if (step === 1 && !canProceedFromStep1) return;
    setStep((s) => Math.min(s + 1, 3));
  };

  const handleBack = () => setStep((s) => Math.max(s - 1, 1));

  /* ─── Submit ─── */
  const onSubmit = handleFormSubmit(async (data) => {
    if (!location) return;
    setSubmitting(true);

    try {
      // 1. Create artifact (without media URLs)
      const artifact = await artifactsApi.create({
        title: data.title,
        description: data.description,
        cultural_origin: data.cultural_origin || '',
        age: data.age || '',
        condition: data.condition || 'Good',
        materials: data.materials || [],
        tags: data.tags || [],
        image_url: null,
        model_url: null,
        thumbnail_url: null,
        is_3d: false,
        uploader_name: null,
        // Backend stores coordinates at top level AND in nested location object
        latitude: location.latitude,
        longitude: location.longitude,
        country: location.country,
        location: {
          coordinates: {
            latitude: location.latitude,
            longitude: location.longitude,
          },
          country: location.country,
          state: location.state,
          city: location.city,
          region: location.region,
        },
      });

      const newId = artifact.id;
      setCreatedArtifactId(newId);

      // 2. Upload image if provided
      let finalImageUrl: string | null = null;
      if (imageUrl) {
        finalImageUrl = imageUrl;
      }

      // 3. Upload model if provided
      let finalModelUrl: string | null = null;
      if (modelUrl) {
        finalModelUrl = modelUrl;
      }

      // 4. Update artifact with media URLs
      if (finalImageUrl || finalModelUrl) {
        await artifactsApi.update(newId, {
          image_url: finalImageUrl,
          model_url: finalModelUrl,
          thumbnail_url: finalImageUrl,
          is_3d: !!finalModelUrl,
        });
      }

      // 5. Invalidate queries
      queryClient.invalidateQueries({ queryKey: artifactKeys.all });

      // 6. Close sheet
      setIsOpen(false);

      // 7. Navigate to new artifact
      router.push(`/artifacts/${newId}`);

      toast.success('Artifact submitted successfully!');
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Submission failed. Please try again.';
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  });

  const handleImageUploadComplete = useCallback((publicUrl: string) => {
    setImageUrl(publicUrl);
  }, []);

  const handleModelUploadComplete = useCallback((publicUrl: string) => {
    setModelUrl(publicUrl);
  }, []);

  const handleClose = () => {
    if (submitting) return; // prevent closing while submitting
    setIsOpen(false);
    // Reset state after animation
    setTimeout(() => {
      setStep(1);
      setLocation(null);
      setImageUrl(null);
      setModelUrl(null);
      setCreatedArtifactId(null);
    }, 300);
  };

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-lg overflow-y-auto"
        showCloseButton={!submitting}
      >
        <SheetHeader className="pb-2">
          <SheetTitle>Submit an Artifact</SheetTitle>
          <SheetDescription>
            Share an archaeological artifact with the community.
          </SheetDescription>
        </SheetHeader>

        {/* Step indicator */}
        <div className="px-4 pb-4 pt-2">
          <StepIndicator current={step} steps={steps} />
        </div>

        <Separator />

        {/* Step content */}
        <div className="flex-1 space-y-4 p-4">
          {/* ── Step 1: Location ── */}
          {step === 1 && (
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-semibold text-foreground">
                  Where was this artifact found?
                </h3>
                <p className="text-xs text-muted-foreground">
                  Click on the map or enter coordinates manually.
                </p>
              </div>
              <LocationPicker
                value={location ? { latitude: location.latitude, longitude: location.longitude } : null}
                onChange={(data) => setLocation(data)}
              />
            </div>
          )}

          {/* ── Step 2: Artifact Details ── */}
          {step === 2 && (
            <div className="space-y-4">
              {/* Title */}
              <div className="space-y-1">
                <Label htmlFor="title">
                  Title <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="title"
                  {...register('title')}
                  placeholder="e.g. Neolithic Flint Arrowhead"
                />
                <div className="flex justify-between">
                  {errors.title && (
                    <p className="text-xs text-destructive">{errors.title.message}</p>
                  )}
                  <p className="ml-auto text-xs text-muted-foreground">
                    {titleValue.length}/200
                  </p>
                </div>
              </div>

              {/* Description */}
              <div className="space-y-1">
                <Label htmlFor="description">
                  Description <span className="text-destructive">*</span>
                </Label>
                <Textarea
                  id="description"
                  {...register('description')}
                  placeholder="Describe the artifact, its context, and significance..."
                  rows={4}
                />
                <div className="flex justify-between">
                  {errors.description && (
                    <p className="text-xs text-destructive">{errors.description.message}</p>
                  )}
                  <p className="ml-auto text-xs text-muted-foreground">
                    {descriptionValue.length}/5000
                  </p>
                </div>
              </div>

              {/* Cultural origin */}
              <div className="space-y-1">
                <Label htmlFor="cultural_origin">Cultural Origin</Label>
                <Input
                  id="cultural_origin"
                  {...register('cultural_origin')}
                  placeholder="e.g. Ancient Egyptian, Viking, Ming Dynasty"
                />
              </div>

              {/* Age */}
              <div className="space-y-1">
                <Label htmlFor="age">Age / Period</Label>
                <Input
                  id="age"
                  {...register('age')}
                  placeholder="e.g. 3000 BCE, 12th Century"
                />
              </div>

              {/* Condition */}
              <div className="space-y-1">
                <Label htmlFor="condition">Condition</Label>
                <Select
                  value={watch('condition') ?? ''}
                  onValueChange={(val) =>
                    setValue('condition', (val ?? undefined) as ArtifactDetailsValues['condition'])
                  }
                >
                  <SelectTrigger id="condition" className="w-full">
                    <SelectValue placeholder="Select condition..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Excellent">Excellent</SelectItem>
                    <SelectItem value="Good">Good</SelectItem>
                    <SelectItem value="Fair">Fair</SelectItem>
                    <SelectItem value="Poor">Poor</SelectItem>
                    <SelectItem value="Fragmentary">Fragmentary</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Materials */}
              <div className="space-y-1">
                <Label>Materials</Label>
                <TagInput
                  value={materialsValue}
                  onChange={(tags) => setValue('materials', tags)}
                  placeholder="Add a material (Enter or comma)..."
                  maxTags={10}
                />
                {errors.materials && (
                  <p className="text-xs text-destructive">{errors.materials.message}</p>
                )}
              </div>

              {/* Tags */}
              <div className="space-y-1">
                <Label>Tags</Label>
                <TagInput
                  value={tagsValue}
                  onChange={(tags) => setValue('tags', tags)}
                  placeholder="Add a tag (Enter or comma)..."
                  maxTags={20}
                />
                {errors.tags && (
                  <p className="text-xs text-destructive">{errors.tags.message}</p>
                )}
              </div>
            </div>
          )}

          {/* ── Step 3: Media Upload ── */}
          {step === 3 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-semibold text-foreground">
                  Upload Images
                </h3>
                <p className="text-xs text-muted-foreground">
                  Add photographs of the artifact (optional but recommended).
                </p>
                <div className="mt-2">
                  <ImageUploader
                    artifactId={createdArtifactId}
                    fileType="image"
                    onUploadComplete={handleImageUploadComplete}
                  />
                </div>
              </div>

              <Separator />

              <div>
                <h3 className="text-sm font-semibold text-foreground">
                  Upload 3D Model
                </h3>
                <p className="text-xs text-muted-foreground">
                  Add a 3D scan or model (optional).
                </p>
                <div className="mt-2">
                  <ImageUploader
                    artifactId={createdArtifactId}
                    fileType="model"
                    onUploadComplete={handleModelUploadComplete}
                  />
                </div>
              </div>

              {!imageUrl && !modelUrl && (
                <p className="text-xs text-muted-foreground">
                  At least one image or 3D model is recommended but not required to proceed.
                </p>
              )}
            </div>
          )}
        </div>

        <Separator />

        {/* Footer navigation */}
        <div className="flex items-center justify-between p-4">
          {step > 1 ? (
            <Button variant="outline" onClick={handleBack} disabled={submitting}>
              Back
            </Button>
          ) : (
            <div />
          )}

          {step < 3 ? (
            <Button onClick={handleNext} disabled={step === 1 && !canProceedFromStep1}>
              Next
            </Button>
          ) : (
            <Button
              onClick={onSubmit}
              disabled={submitting}
            >
              {submitting ? 'Submitting...' : 'Submit Artifact'}
            </Button>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

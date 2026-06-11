'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod/v4';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import {
  CheckIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  Loader2,
} from 'lucide-react';
import Link from 'next/link';

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogAction,
  AlertDialogCancel,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useUiStore } from '@/store/uiStore';
import { artifactsApi } from '@/lib/api';
import { artifactKeys } from '@/hooks/useArtifacts';
import LocationPicker from '@/components/shared/LocationPicker';
import type { LocationData } from '@/components/shared/LocationPicker';
import ImageUploader from '@/components/shared/ImageUploader';
import TagInput from '@/components/shared/TagInput';
import { cn } from '@/lib/utils';

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

/* ─── Steps ─── */
const STEPS = [
  { id: 'location', label: 'Location' },
  { id: 'details', label: 'Details' },
  { id: 'media', label: 'Evidence' },
] as const;

/* ─── Condition options ─── */
const CONDITION_OPTIONS = [
  { value: 'Excellent', icon: '⭐', label: 'Excellent' },
  { value: 'Good', icon: '✓', label: 'Good' },
  { value: 'Fair', icon: '~', label: 'Fair' },
  { value: 'Poor', icon: '▿', label: 'Poor' },
  { value: 'Fragmentary', icon: '◌', label: 'Fragmentary' },
] as const;

/* ─── Age presets ─── */
const AGE_PRESETS = [
  'Paleolithic',
  'Neolithic',
  'Bronze Age',
  'Iron Age',
  'Classical Antiquity',
  'Medieval',
  'Renaissance',
  'Early Modern',
  'Modern',
  'Custom...',
] as const;

/* ─── Material suggestions ─── */
const MATERIAL_SUGGESTIONS = [
  'Bronze', 'Iron', 'Clay/Pottery', 'Stone', 'Gold',
  'Silver', 'Bone/Ivory', 'Textile', 'Glass', 'Wood',
];

/* ─── Tag suggestions ─── */
const TAG_SUGGESTIONS = [
  'pottery', 'ceremonial', 'tool', 'weapon',
  'jewelry', 'architectural', 'funerary', 'domestic',
];

/* ─── Step Indicator ─── */
function StepIndicator({
  currentStep,
  onStepClick,
}: {
  currentStep: number;
  onStepClick: (step: number) => void;
}) {
  return (
    <div className="px-6 py-4 border-b border-secondary/40">
      <div className="flex items-center gap-0">
        {STEPS.map((step, idx) => (
          <div key={step.id} className="flex items-center flex-1">
            {/* Step circle */}
            <button
              onClick={() => idx < currentStep && onStepClick(idx)}
              disabled={idx > currentStep}
              className={cn(
                'flex flex-col items-center gap-1.5 relative z-10',
                idx < currentStep && 'cursor-pointer',
                idx >= currentStep && 'cursor-default'
              )}
            >
              <div
                className={cn(
                  'w-8 h-8 rounded-full flex items-center justify-center',
                  'text-xs font-semibold transition-all duration-300',
                  idx < currentStep && 'bg-primary text-white',
                  idx === currentStep && 'bg-primary text-white ring-4 ring-primary/20',
                  idx > currentStep && 'bg-muted text-muted-foreground border border-secondary'
                )}
              >
                {idx < currentStep ? (
                  <CheckIcon className="h-4 w-4" />
                ) : (
                  idx + 1
                )}
              </div>
              <span
                className={cn(
                  'text-[10px] font-medium whitespace-nowrap',
                  idx === currentStep ? 'text-primary' : 'text-muted-foreground'
                )}
              >
                {step.label}
              </span>
            </button>

            {/* Connector line between steps */}
            {idx < STEPS.length - 1 && (
              <div
                className="flex-1 h-[2px] mx-2 mt-[-14px] rounded-full transition-all duration-500"
                style={{
                  background:
                    idx < currentStep ? '#B8860B' : '#D4C5A9',
                }}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── Auto-resize textarea hook ─── */
function useAutoResize(ref: React.RefObject<HTMLTextAreaElement | null>, value: string) {
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.max(el.scrollHeight, 96)}px`;
  }, [ref, value]);
}

/* ─── Success State ─── */
function SuccessState({
  newArtifactId,
  onReset,
}: {
  newArtifactId: string;
  onReset: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center h-full py-12 px-6 text-center">
      {/* Animated checkmark SVG */}
      <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-6">
        <motion.svg
          width="52"
          height="52"
          viewBox="0 0 52 52"
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
        >
          <motion.path
            d="M 14 27 L 22 35 L 38 17"
            stroke="#B8860B"
            strokeWidth="3"
            fill="none"
            strokeLinecap="round"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 0.6, ease: 'easeOut', delay: 0.1 }}
          />
        </motion.svg>
      </div>

      <h2 className="font-display text-2xl font-bold mb-2">
        Artifact Registered
      </h2>
      <p className="text-muted-foreground text-sm mb-8 max-w-xs">
        Your artifact has been added to the Global Archaeological Database.
        Thank you for contributing to the world's archaeological heritage.
      </p>

      <div className="flex flex-col gap-3 w-full max-w-xs">
        <Link
          href={`/artifacts/${newArtifactId}`}
          className="inline-flex items-center justify-center rounded-lg bg-primary text-primary-foreground hover:bg-primary/80 h-8 gap-1.5 px-2.5 text-sm font-medium whitespace-nowrap transition-all shadow-warm-sm"
        >
          View Your Artifact
        </Link>
        <Button variant="outline" onClick={onReset}>
          Submit Another
        </Button>
      </div>
    </div>
  );
}

/* ─── Main form ─── */
export default function ArtifactSubmitForm() {
  const queryClient = useQueryClient();
  const isOpen = useUiStore((s) => s.isSubmitFormOpen);
  const setIsOpen = useUiStore((s) => s.setIsSubmitFormOpen);

  const [currentStep, setCurrentStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [newArtifactId, setNewArtifactId] = useState<string | null>(null);
  const [showLeaveDialog, setShowLeaveDialog] = useState(false);

  // Track if form has any data entered (for dirty check)
  const [isDirty, setIsDirty] = useState(false);

  // Step 1 — Location
  const [location, setLocation] = useState<LocationData | null>(null);

  // Step 2 — Details (react-hook-form)
  const {
    register,
    handleSubmit: handleFormSubmit,
    watch,
    setValue,
    trigger,
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
  const conditionValue = watch('condition');
  const ageValue = watch('age');

  // Age combobox state
  const [ageInput, setAgeInput] = useState('');
  const [showAgeCustom, setShowAgeCustom] = useState(false);

  // Description auto-resize
  const descriptionRef = useRef<HTMLTextAreaElement | null>(null);
  useAutoResize(descriptionRef, descriptionValue);

  // Step 3 — Media
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [modelUrl, setModelUrl] = useState<string | null>(null);
  const [createdArtifactId, setCreatedArtifactId] = useState<string | null>(null);

  const locationIsValid =
    location !== null && !isNaN(location.latitude) && !isNaN(location.longitude);

  const canProceedFromStep1 = locationIsValid;

  // Mark form as dirty when any field has data
  useEffect(() => {
    if (
      location ||
      titleValue ||
      descriptionValue ||
      materialsValue.length > 0 ||
      tagsValue.length > 0 ||
      imageUrl ||
      modelUrl
    ) {
      setIsDirty(true);
    }
  }, [location, titleValue, descriptionValue, materialsValue, tagsValue, imageUrl, modelUrl]);

  const handleNext = async () => {
    if (currentStep === 0 && !canProceedFromStep1) return;

    // Validate step 2 fields before proceeding
    if (currentStep === 1) {
      const isValid = await trigger(['title', 'description']);
      if (!isValid) {
        // Scroll to first error
        const firstError = document.querySelector('[data-slot="textarea"],[data-slot="input"]');
        firstError?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        return;
      }
    }

    setCurrentStep((s) => Math.min(s + 1, 2));
  };

  const handleBack = () => setCurrentStep((s) => Math.max(s - 1, 0));

  const handleStepClick = (step: number) => {
    if (step < currentStep) {
      setCurrentStep(step);
    }
  };

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

      // 6. Show success state
      setNewArtifactId(newId);
      setSubmitted(true);

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

  const resetForm = () => {
    setCurrentStep(0);
    setLocation(null);
    setImageUrl(null);
    setModelUrl(null);
    setCreatedArtifactId(null);
    setSubmitted(false);
    setNewArtifactId(null);
    setIsDirty(false);
    setShowAgeCustom(false);
    setAgeInput('');
  };

  const handleClose = () => {
    if (submitting) return;
    if (isDirty && !submitted) {
      setShowLeaveDialog(true);
      return;
    }
    setIsOpen(false);
    setTimeout(resetForm, 300);
  };

  const confirmLeave = () => {
    setShowLeaveDialog(false);
    setIsOpen(false);
    setTimeout(resetForm, 300);
  };

  // Handle age preset selection
  const handleAgePreset = (preset: string) => {
    if (preset === 'Custom...') {
      setShowAgeCustom(true);
      setValue('age', '');
      setAgeInput('');
    } else {
      setShowAgeCustom(false);
      setValue('age', preset);
      setAgeInput(preset);
    }
  };

  return (
    <>
      <Sheet open={isOpen} onOpenChange={(open) => !open && handleClose()}>
        <SheetContent
          side="right"
          className="w-full sm:w-[540px] overflow-y-auto flex flex-col p-0 gap-0"
          showCloseButton={!submitting}
        >
          {submitted && newArtifactId ? (
            <SuccessState newArtifactId={newArtifactId} onReset={resetForm} />
          ) : (
            <>
              <SheetHeader className="px-6 pt-6 pb-2">
                <SheetTitle>Submit an Artifact</SheetTitle>
                <SheetDescription>
                  Share an archaeological artifact with the community.
                </SheetDescription>
              </SheetHeader>

              {/* Step indicator */}
              <StepIndicator currentStep={currentStep} onStepClick={handleStepClick} />

              {/* Step content */}
              <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
                {/* ── Step 0: Location ── */}
                {currentStep === 0 && (
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
                      value={
                        location
                          ? { latitude: location.latitude, longitude: location.longitude }
                          : null
                      }
                      onChange={(data) => setLocation(data)}
                    />
                  </div>
                )}

                {/* ── Step 1: Artifact Details ── */}
                {currentStep === 1 && (
                  <div className="space-y-5">
                    {/* Title */}
                    <div className="space-y-1">
                      <div className="flex justify-between items-center mb-1">
                        <Label>
                          Title <span className="text-destructive">*</span>
                        </Label>
                        <span className="text-[10px] text-muted-foreground">
                          {titleValue.length}/200
                        </span>
                      </div>
                      <Input
                        {...register('title')}
                        placeholder="e.g. Neolithic Flint Arrowhead"
                      />
                      {errors.title && (
                        <p className="text-xs text-destructive mt-1 flex items-center gap-1">
                          {errors.title.message}
                        </p>
                      )}
                    </div>

                    {/* Description */}
                    <div className="space-y-1">
                      <div className="flex justify-between items-center mb-1">
                        <Label>
                          Description <span className="text-destructive">*</span>
                        </Label>
                        <span className="text-[10px] text-muted-foreground">
                          {descriptionValue.length}/5000
                        </span>
                      </div>
                      <div className="relative">
                        <Textarea
                          {...register('description')}
                          ref={(e) => {
                            register('description').ref(e);
                            descriptionRef.current = e;
                          }}
                          placeholder="Describe the artifact, its context, and significance..."
                          className="resize-none overflow-hidden min-h-[96px]"
                        />
                      </div>
                      {errors.description && (
                        <p className="text-xs text-destructive mt-1 flex items-center gap-1">
                          {errors.description.message}
                        </p>
                      )}
                    </div>

                    {/* Age / Period */}
                    <div className="space-y-1">
                      <Label>Age / Period</Label>
                      {!showAgeCustom ? (
                        <div className="flex flex-wrap gap-1.5">
                          {AGE_PRESETS.map((preset) => (
                            <button
                              key={preset}
                              type="button"
                              onClick={() => handleAgePreset(preset)}
                              className={cn(
                                'rounded-full border px-3 py-1 text-xs font-medium transition-all',
                                ageInput === preset
                                  ? 'bg-primary/15 border-primary/50 text-primary'
                                  : 'bg-muted border-secondary text-muted-foreground hover:border-primary/40 hover:text-foreground'
                              )}
                            >
                              {preset}
                            </button>
                          ))}
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <Input
                            value={ageInput}
                            onChange={(e) => {
                              setAgeInput(e.target.value);
                              setValue('age', e.target.value);
                            }}
                            placeholder="E.g., Roman Period (27 BCE–476 CE)"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              setShowAgeCustom(false);
                              setAgeInput('');
                              setValue('age', '');
                            }}
                            className="text-xs text-muted-foreground hover:text-foreground"
                          >
                            ← Back to presets
                          </button>
                        </div>
                      )}
                      <p className="text-xs text-muted-foreground mt-1">
                        E.g., Roman Period (27 BCE–476 CE)
                      </p>
                    </div>

                    {/* Materials (TagInput) */}
                    <div className="space-y-1">
                      <Label>Materials</Label>
                      <TagInput
                        value={materialsValue}
                        onChange={(tags) => setValue('materials', tags)}
                        placeholder="Add a material (Enter or comma)..."
                        maxTags={10}
                        suggestions={MATERIAL_SUGGESTIONS}
                      />
                      {errors.materials && (
                        <p className="text-xs text-destructive mt-1 flex items-center gap-1">
                          {errors.materials.message}
                        </p>
                      )}
                    </div>

                    {/* Condition — visual rating */}
                    <div className="space-y-1">
                      <Label>Condition</Label>
                      <div className="flex flex-wrap gap-2">
                        {CONDITION_OPTIONS.map((option) => (
                          <button
                            key={option.value}
                            type="button"
                            onClick={() =>
                              setValue(
                                'condition',
                                option.value as ArtifactDetailsValues['condition']
                              )
                            }
                            className={cn(
                              'inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-all',
                              conditionValue === option.value
                                ? 'bg-primary/15 border-primary/50 text-primary'
                                : 'bg-muted border-secondary text-muted-foreground hover:border-primary/40 hover:text-foreground'
                            )}
                          >
                            <span className="text-sm">{option.icon}</span>
                            {option.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Cultural Origin */}
                    <div className="space-y-1">
                      <Label>Cultural Origin</Label>
                      <Input
                        {...register('cultural_origin')}
                        placeholder="E.g., Ancient Roman, Mayan, Ming Dynasty"
                      />
                    </div>

                    {/* Tags (TagInput) */}
                    <div className="space-y-1">
                      <Label>Tags</Label>
                      <TagInput
                        value={tagsValue}
                        onChange={(tags) => setValue('tags', tags)}
                        placeholder="Add a tag (Enter or comma)..."
                        maxTags={20}
                        suggestions={TAG_SUGGESTIONS}
                      />
                      {errors.tags && (
                        <p className="text-xs text-destructive mt-1 flex items-center gap-1">
                          {errors.tags.message}
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {/* ── Step 2: Media Upload ── */}
                {currentStep === 2 && (
                  <div className="space-y-4">
                    {/* 2D Image Upload Zone */}
                    <div>
                      <Label className="text-sm font-medium mb-2 block">
                        Photograph
                        <span className="text-xs text-muted-foreground font-normal ml-2">
                          JPG, PNG, WEBP · Max 50MB
                        </span>
                      </Label>
                      <ImageUploader
                        artifactId={createdArtifactId}
                        fileType="image"
                        onUploadComplete={handleImageUploadComplete}
                      />
                    </div>

                    {/* 3D Model Upload Zone */}
                    <div>
                      <Label className="text-sm font-medium mb-2 block">
                        3D Model
                        <span className="text-xs text-muted-foreground font-normal ml-2">
                          GLB, GLTF · Max 200MB · Optional
                        </span>
                      </Label>
                      <ImageUploader
                        artifactId={createdArtifactId}
                        fileType="model"
                        onUploadComplete={handleModelUploadComplete}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Navigation Footer */}
              <div className="border-t border-secondary/40 p-4 flex items-center justify-between bg-background">
                {currentStep > 0 ? (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleBack}
                    className="gap-1.5"
                  >
                    <ChevronLeftIcon className="h-4 w-4" />
                    Back
                  </Button>
                ) : (
                  <div />
                )}
                {currentStep < 2 ? (
                  <Button
                    onClick={handleNext}
                    size="sm"
                    disabled={currentStep === 0 && !canProceedFromStep1}
                    className="ml-auto gap-1.5 bg-primary hover:bg-primary/90 shadow-warm-sm hover:shadow-golden transition-all"
                  >
                    Continue
                    <ChevronRightIcon className="h-4 w-4" />
                  </Button>
                ) : (
                  <Button
                    onClick={onSubmit}
                    size="sm"
                    disabled={submitting}
                    className="ml-auto gap-1.5 bg-primary hover:bg-primary/90 shadow-warm-sm hover:shadow-golden"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin text-primary-foreground" /> Submitting...
                      </>
                    ) : (
                      <>
                        <CheckIcon className="h-4 w-4" /> Submit Artifact
                      </>
                    )}
                  </Button>
                )}
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

      {/* Leave confirmation dialog */}
      <AlertDialog open={showLeaveDialog} onOpenChange={setShowLeaveDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Leave form?</AlertDialogTitle>
            <AlertDialogDescription>
              Your artifact data will be lost. Are you sure you want to close this form?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setShowLeaveDialog(false)}>
              Stay
            </AlertDialogCancel>
            <AlertDialogAction onClick={confirmLeave}>
              Leave
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod/v4';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CheckIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  Loader2,
  CheckCircle2Icon,
  MinusCircleIcon,
  AlertCircleIcon,
  ScatterChartIcon,
  GlobeIcon,
  FileImageIcon,
  BoxIcon,
  SparklesIcon,
} from 'lucide-react';
import Link from 'next/link';

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
import { artifactsApi } from '@/lib/api';
import { artifactKeys, useArtifact, useUpdateArtifact } from '@/hooks/useArtifacts';
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
  { id: 'location', label: 'Location', icon: GlobeIcon },
  { id: 'details', label: 'Details', icon: SparklesIcon },
  { id: 'media', label: 'Evidence', icon: FileImageIcon },
] as const;

/* ─── Condition options with Lucide icons ─── */
const CONDITION_OPTIONS = [
  { value: 'Excellent', icon: CheckCircle2Icon, label: 'Excellent' },
  { value: 'Good', icon: CheckIcon, label: 'Good' },
  { value: 'Fair', icon: MinusCircleIcon, label: 'Fair' },
  { value: 'Poor', icon: AlertCircleIcon, label: 'Poor' },
  { value: 'Fragmentary', icon: ScatterChartIcon, label: 'Fragmentary' },
] as const;

/* ─── Age presets with year ranges ─── */
const AGE_PRESETS: { label: string; range: string }[] = [
  { label: 'Paleolithic', range: '~2.5M – 10,000 BCE' },
  { label: 'Neolithic', range: '10,000 – 2,000 BCE' },
  { label: 'Bronze Age', range: '3,300 – 1,200 BCE' },
  { label: 'Iron Age', range: '1,200 – 500 BCE' },
  { label: 'Classical Antiquity', range: '500 BCE – 500 CE' },
  { label: 'Medieval', range: '500 – 1,500 CE' },
  { label: 'Renaissance', range: '1,400 – 1,600 CE' },
  { label: 'Early Modern', range: '1,500 – 1,800 CE' },
  { label: 'Modern', range: '1,800 CE – Present' },
  { label: 'Custom...', range: '' },
];

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
    <div className="border-b border-secondary/40 bg-background/95 backdrop-blur-sm sticky top-0 z-20">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-4">
        <div className="flex items-center gap-0">
          {STEPS.map((step, idx) => {
            const StepIcon = step.icon;
            return (
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
                      'w-10 h-10 rounded-full flex items-center justify-center',
                      'text-sm font-semibold transition-all duration-300',
                      idx < currentStep && 'bg-primary text-white',
                      idx === currentStep && 'bg-primary text-white ring-4 ring-primary/20',
                      idx > currentStep && 'bg-muted text-muted-foreground border border-secondary'
                    )}
                  >
                    {idx < currentStep ? (
                      <CheckIcon className="h-5 w-5" />
                    ) : (
                      <StepIcon className="h-5 w-5" />
                    )}
                  </div>
                  <span
                    className={cn(
                      'text-[11px] font-medium whitespace-nowrap hidden sm:block',
                      idx === currentStep ? 'text-primary' : 'text-muted-foreground'
                    )}
                  >
                    {step.label}
                  </span>
                </button>

                {/* Connector line between steps */}
                {idx < STEPS.length - 1 && (
                  <div
                    className="flex-1 h-[3px] mx-3 mt-[-18px] rounded-full transition-all duration-500"
                    style={{
                      background:
                        idx < currentStep ? '#B8860B' : 'var(--border)',
                    }}
                  />
                )}
              </div>
            );
          })}
        </div>
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
  isEditMode,
}: {
  newArtifactId: string;
  onReset: () => void;
  isEditMode?: boolean;
}) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] py-16 px-6 text-center">
      {/* Animated checkmark SVG */}
      <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center mb-6">
        <motion.svg
          width="64"
          height="64"
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

      <h2 className="font-display text-3xl font-bold mb-3">
        {isEditMode ? 'Artifact Updated' : 'Artifact Registered'}
      </h2>
      <p className="text-muted-foreground text-sm mb-10 max-w-md">
        {isEditMode
          ? 'Your artifact has been updated successfully.'
          : 'Your artifact has been added to the Global Archaeological Database. Thank you for contributing to the world\'s archaeological heritage.'}
      </p>

      <div className="flex flex-col sm:flex-row gap-3 w-full max-w-sm">
        <Link
          href={`/artifacts/${newArtifactId}`}
          className="inline-flex items-center justify-center rounded-lg bg-primary text-primary-foreground hover:bg-primary/80 h-10 gap-1.5 px-4 text-sm font-medium whitespace-nowrap transition-all shadow-warm-sm"
        >
          View Your Artifact
        </Link>
        {!isEditMode && (
          <Button variant="outline" onClick={onReset} size="lg">
            Submit Another
          </Button>
        )}
      </div>
    </div>
  );
}

/* ─── Step content wrapper with animation ─── */
function StepContent({ currentStep, children }: { currentStep: number; children: React.ReactNode }) {
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={currentStep}
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -20 }}
        transition={{ duration: 0.25, ease: 'easeInOut' }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}

/* ─── Main form ─── */
export default function ArtifactSubmitForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get('edit');
  const isEditMode = !!editId;

  const queryClient = useQueryClient();

  // Fetch existing artifact if in edit mode
  const { data: existingArtifact, isLoading: isLoadingArtifact } = useArtifact(editId);

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
    reset,
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
  const [approximateYear, setApproximateYear] = useState('');
  const [yearEra, setYearEra] = useState<'BCE' | 'CE'>('CE');

  // Description auto-resize
  const descriptionRef = useRef<HTMLTextAreaElement | null>(null);
  useAutoResize(descriptionRef, descriptionValue);

  // Step 3 — Media
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [modelUrl, setModelUrl] = useState<string | null>(null);
  const [createdArtifactId, setCreatedArtifactId] = useState<string | null>(null);

  // Pre-fill form when existing artifact loads in edit mode
  useEffect(() => {
    if (existingArtifact && isEditMode) {
      // Set location
      if (existingArtifact.location?.coordinates) {
        setLocation({
          latitude: existingArtifact.location.coordinates.latitude,
          longitude: existingArtifact.location.coordinates.longitude,
          country: existingArtifact.location.country || '',
          state: existingArtifact.location.state || '',
          city: existingArtifact.location.city || '',
          region: existingArtifact.location.region || '',
        });
      }

      // Set form values
      reset({
        title: existingArtifact.title || '',
        description: existingArtifact.description || '',
        cultural_origin: existingArtifact.cultural_origin || '',
        age: existingArtifact.age || '',
        condition: (existingArtifact.condition as ArtifactDetailsValues['condition']) || undefined,
        materials: existingArtifact.materials || [],
        tags: existingArtifact.tags || [],
      });

      // Set age input
      if (existingArtifact.age) {
        const isPreset = AGE_PRESETS.some((p) => p.label === existingArtifact.age);
        if (isPreset) {
          setAgeInput(existingArtifact.age);
          setShowAgeCustom(false);
        } else {
          setAgeInput(existingArtifact.age);
          setShowAgeCustom(true);
        }
      }

      // Set media URLs
      if (existingArtifact.image_url) {
        setImageUrl(existingArtifact.image_url);
      }
      if (existingArtifact.model_url) {
        setModelUrl(existingArtifact.model_url);
      }

      setCreatedArtifactId(existingArtifact.id);
    }
  }, [existingArtifact, isEditMode, reset]);

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

  /* ─── Submit / Update ─── */
  const onSubmit = handleFormSubmit(async (data) => {
    if (!location) return;
    setSubmitting(true);

    try {
      // Build age string with approximate year if provided
      let ageString = data.age || '';
      if (approximateYear && !ageString) {
        ageString = `~${approximateYear} ${yearEra}`;
      } else if (approximateYear && ageString) {
        ageString = `${ageString} (~${approximateYear} ${yearEra})`;
      }

      if (isEditMode && editId) {
        // ── UPDATE MODE ──
        await artifactsApi.update(editId, {
          title: data.title,
          description: data.description,
          cultural_origin: data.cultural_origin || '',
          age: ageString,
          condition: data.condition || 'Good',
          materials: data.materials || [],
          tags: data.tags || [],
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
          image_url: imageUrl,
          model_url: modelUrl,
          thumbnail_url: imageUrl,
          is_3d: !!modelUrl,
        });

        // Invalidate queries
        queryClient.invalidateQueries({ queryKey: artifactKeys.all });
        queryClient.invalidateQueries({ queryKey: artifactKeys.detail(editId) });

        setNewArtifactId(editId);
        setSubmitted(true);

        toast.success('Artifact updated successfully!');
      } else {
        // ── CREATE MODE ──
        // 1. Create artifact (without media URLs)
        const artifact = await artifactsApi.create({
          title: data.title,
          description: data.description,
          cultural_origin: data.cultural_origin || '',
          age: ageString,
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
      }
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
    setApproximateYear('');
    setYearEra('CE');
    reset({
      title: '',
      description: '',
      cultural_origin: '',
      age: '',
      condition: undefined,
      materials: [],
      tags: [],
    });
  };

  const confirmLeave = () => {
    setShowLeaveDialog(false);
    if (isEditMode) {
      router.push('/dashboard');
    } else {
      resetForm();
    }
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

  // Show loading state while fetching artifact for edit
  if (isEditMode && isLoadingArtifact) {
    return (
      <div className="min-h-[100dvh] flex flex-col bg-background">
        <div className="flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Loading artifact...</p>
          </div>
        </div>
      </div>
    );
  }

  // Show error if edit mode but no artifact found
  if (isEditMode && !isLoadingArtifact && !existingArtifact) {
    return (
      <div className="min-h-[100dvh] flex flex-col bg-background">
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <h2 className="font-display text-xl font-semibold mb-2">Artifact not found</h2>
            <p className="text-sm text-muted-foreground mb-4">
              The artifact you're trying to edit doesn't exist.
            </p>
            <Button onClick={() => router.push('/dashboard')}>
              Back to Dashboard
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="min-h-[100dvh] flex flex-col bg-background">
        {/* Header */}
        <div className="border-b border-secondary/40 bg-background/95 backdrop-blur-sm">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
            <div>
              <h1 className="font-display text-xl sm:text-2xl font-bold text-foreground">
                {isEditMode ? 'Edit Artifact' : 'Submit an Artifact'}
              </h1>
              <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
                {isEditMode
                  ? 'Update the details of your artifact.'
                  : 'Share an archaeological artifact with the community.'}
              </p>
            </div>
            {!submitted && (
              <button
                onClick={() => {
                  if (isDirty) {
                    setShowLeaveDialog(true);
                  } else {
                    if (isEditMode) {
                      router.push('/dashboard');
                    } else {
                      resetForm();
                      window.history.back();
                    }
                  }
                }}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors px-3 py-1.5 rounded-lg hover:bg-muted"
                disabled={submitting}
              >
                Cancel
              </button>
            )}
          </div>
        </div>

        {/* Step indicator */}
        <StepIndicator currentStep={currentStep} onStepClick={handleStepClick} />

        {/* Step content */}
        <div className="flex-1">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
            {submitted && newArtifactId ? (
              <SuccessState newArtifactId={newArtifactId} onReset={resetForm} isEditMode={isEditMode} />
            ) : (
              <StepContent currentStep={currentStep}>
                {/* ── Step 0: Location ── */}
                {currentStep === 0 && (
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-base sm:text-lg font-semibold text-foreground">
                        Where was this artifact found?
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        Click on the map or enter coordinates manually.
                      </p>
                    </div>
                    <div className="h-[400px] sm:h-[450px] rounded-xl overflow-hidden border border-secondary/40 shadow-warm-sm">
                      <LocationPicker
                        value={
                          location
                            ? { latitude: location.latitude, longitude: location.longitude }
                            : null
                        }
                        onChange={(data) => setLocation(data)}
                      />
                    </div>
                  </div>
                )}

                {/* ── Step 1: Artifact Details ── */}
                {currentStep === 1 && (
                  <div className="space-y-6">
                    {/* Title */}
                    <div className="space-y-1.5">
                      <div className="flex justify-between items-center mb-1">
                        <Label className="text-sm font-medium">
                          Title <span className="text-destructive">*</span>
                        </Label>
                        <span className="text-[11px] text-muted-foreground">
                          {titleValue.length}/200
                        </span>
                      </div>
                      <Input
                        {...register('title')}
                        placeholder="e.g. Neolithic Flint Arrowhead"
                        className="h-11 text-base"
                      />
                      {errors.title && (
                        <p className="text-xs text-destructive mt-1 flex items-center gap-1">
                          {errors.title.message}
                        </p>
                      )}
                    </div>

                    {/* Description */}
                    <div className="space-y-1.5">
                      <div className="flex justify-between items-center mb-1">
                        <Label className="text-sm font-medium">
                          Description <span className="text-destructive">*</span>
                        </Label>
                        <span className="text-[11px] text-muted-foreground">
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
                          className="resize-none overflow-hidden min-h-[120px] text-base"
                        />
                      </div>
                      {errors.description && (
                        <p className="text-xs text-destructive mt-1 flex items-center gap-1">
                          {errors.description.message}
                        </p>
                      )}
                    </div>

                    {/* Age / Period — Optional */}
                    <div className="space-y-1.5">
                      <Label className="text-sm font-medium">
                        Age / Period <span className="text-muted-foreground font-normal">(optional)</span>
                      </Label>
                      {!showAgeCustom ? (
                        <div className="flex flex-wrap gap-2">
                          {AGE_PRESETS.map((preset) => (
                            <button
                              key={preset.label}
                              type="button"
                              onClick={() => handleAgePreset(preset.label)}
                              className={cn(
                                'rounded-full border px-3.5 py-2 text-sm font-medium transition-all',
                                ageInput === preset.label
                                  ? 'bg-primary/15 border-primary/50 text-primary'
                                  : 'bg-muted border-secondary text-muted-foreground hover:border-primary/40 hover:text-foreground'
                              )}
                            >
                              <span>{preset.label}</span>
                              {preset.range && (
                                <span className="block text-[10px] text-muted-foreground mt-0.5 opacity-70">
                                  {preset.range}
                                </span>
                              )}
                            </button>
                          ))}
                        </div>
                      ) : (
                        <div className="space-y-3">
                          <Input
                            value={ageInput}
                            onChange={(e) => {
                              setAgeInput(e.target.value);
                              setValue('age', e.target.value);
                            }}
                            placeholder="E.g., Roman Period (27 BCE–476 CE)"
                            className="h-11 text-base"
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

                      {/* Approximate Year (optional) */}
                      <div className="mt-3 pt-3 border-t border-secondary/20">
                        <Label className="text-xs text-muted-foreground mb-2 block">
                          Approximate Year <span className="font-normal">(optional)</span>
                        </Label>
                        <div className="flex items-center gap-2">
                          <Input
                            value={approximateYear}
                            onChange={(e) => setApproximateYear(e.target.value)}
                            placeholder="e.g. 500"
                            className="h-10 w-32 text-base"
                            type="number"
                          />
                          <select
                            value={yearEra}
                            onChange={(e) => setYearEra(e.target.value as 'BCE' | 'CE')}
                            className="h-10 rounded-lg border border-secondary bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                          >
                            <option value="CE">CE</option>
                            <option value="BCE">BCE</option>
                          </select>
                          <span className="text-xs text-muted-foreground">
                            (e.g., 500 BCE)
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Materials (TagInput) */}
                    <div className="space-y-1.5">
                      <Label className="text-sm font-medium">Materials</Label>
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

                    {/* Condition — visual rating with Lucide icons */}
                    <div className="space-y-1.5">
                      <Label className="text-sm font-medium">Condition</Label>
                      <div className="flex flex-wrap gap-2">
                        {CONDITION_OPTIONS.map((option) => {
                          const OptionIcon = option.icon;
                          return (
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
                                'inline-flex items-center gap-2 rounded-full border px-4 py-2.5 text-sm font-medium transition-all',
                                conditionValue === option.value
                                  ? 'bg-primary/15 border-primary/50 text-primary'
                                  : 'bg-muted border-secondary text-muted-foreground hover:border-primary/40 hover:text-foreground'
                              )}
                            >
                              <OptionIcon
                                className={cn(
                                  'h-4 w-4',
                                  conditionValue === option.value
                                    ? 'text-primary'
                                    : 'text-muted-foreground'
                                )}
                              />
                              {option.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Cultural Origin */}
                    <div className="space-y-1.5">
                      <Label className="text-sm font-medium">Cultural Origin</Label>
                      <Input
                        {...register('cultural_origin')}
                        placeholder="E.g., Ancient Roman, Mayan, Ming Dynasty"
                        className="h-11 text-base"
                      />
                    </div>

                    {/* Tags (TagInput) */}
                    <div className="space-y-1.5">
                      <Label className="text-sm font-medium">Tags</Label>
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
                  <div className="space-y-6">
                    {/* 2D Image Upload Zone */}
                    <div>
                      <Label className="text-sm font-medium mb-3 block">
                        <span className="flex items-center gap-2">
                          <FileImageIcon className="h-4 w-4 text-primary" />
                          Photograph
                        </span>
                        <span className="text-xs text-muted-foreground font-normal ml-0 block mt-1">
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
                      <Label className="text-sm font-medium mb-3 block">
                        <span className="flex items-center gap-2">
                          <BoxIcon className="h-4 w-4 text-primary" />
                          3D Model
                        </span>
                        <span className="text-xs text-muted-foreground font-normal ml-0 block mt-1">
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
              </StepContent>
            )}
          </div>
        </div>

        {/* Navigation Footer — sticky bottom */}
        {!submitted && (
          <div className="border-t border-secondary/40 bg-background/95 backdrop-blur-sm sticky bottom-0 z-20">
            <div className="max-w-3xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
              {currentStep > 0 ? (
                <Button
                  variant="ghost"
                  size="lg"
                  onClick={handleBack}
                  className="gap-1.5"
                >
                  <ChevronLeftIcon className="h-5 w-5" />
                  Back
                </Button>
              ) : (
                <div />
              )}
              {currentStep < 2 ? (
                <Button
                  onClick={handleNext}
                  disabled={currentStep === 0 && !canProceedFromStep1}
                  size="lg"
                  className="gap-1.5"
                >
                  Continue
                  <ChevronRightIcon className="h-5 w-5" />
                </Button>
              ) : (
                <Button
                  type="submit"
                  onClick={onSubmit}
                  disabled={submitting}
                  size="lg"
                  className="gap-1.5"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      {isEditMode ? 'Updating...' : 'Submitting...'}
                    </>
                  ) : (
                    <>
                      <CheckIcon className="h-5 w-5" />
                      {isEditMode ? 'Update Artifact' : 'Submit Artifact'}
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Leave Confirmation Dialog */}
      <AlertDialog open={showLeaveDialog} onOpenChange={setShowLeaveDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Discard changes?</AlertDialogTitle>
            <AlertDialogDescription>
              You have unsaved changes. Are you sure you want to leave?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep editing</AlertDialogCancel>
            <AlertDialogAction onClick={confirmLeave}>
              Discard
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
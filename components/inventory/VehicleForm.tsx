'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { useAccount } from '@/lib/thirdweb';
import { useCreateVehicle, useUpdateVehicle, useDeleteImage, useReorderImages, useVehicle } from '@/hooks/useInventory';
import { VINDecoder } from './VINDecoder';
import { ImageUploader, type LocalImage, type UploadedImage } from './ImageUploader';
import { POPULAR_BRANDS, getYearOptions, BODY_TYPES, EXTERIOR_COLORS, INTERIOR_COLORS, VEHICLE_FEATURES, type DecodedVIN } from '@/lib/inventory/vin-fields';
import type { VehicleImage } from '@/lib/supabase/types';
import { Car, Settings, ImageIcon, DollarSign, ChevronLeft, ChevronRight, Loader2, Check, Phone, MapPin } from 'lucide-react';

// =====================================================
// Types
// =====================================================

interface VehicleFormData {
  vin: string;
  brand: string;
  model: string;
  year: number;
  trim: string;
  body_type: string;
  doors: number;
  price: number;
  price_negotiable: boolean;
  mileage: number;
  condition: string;
  exterior_color: string;
  interior_color: string;
  transmission: string;
  fuel_type: string;
  drivetrain: string;
  engine: string;
  description: string;
  features: string[];
  contact_phone: string;
  contact_whatsapp: string;
  contact_city: string;
  contact_state: string;
}

interface VehicleFormProps {
  editVehicleId?: string;
  initialData?: Partial<VehicleFormData>;
  existingImages?: VehicleImage[];
  onSuccess: (vehicleId: string) => void;
  onCancel: () => void;
}

const STEPS = ['vehicle', 'specs', 'photos', 'publish'] as const;
type Step = typeof STEPS[number];

const STEP_ICONS = {
  vehicle: Car,
  specs: Settings,
  photos: ImageIcon,
  publish: DollarSign,
};

const DEFAULT_DATA: VehicleFormData = {
  vin: '', brand: '', model: '', year: new Date().getFullYear(), trim: '',
  body_type: '', doors: 4, price: 0, price_negotiable: true, mileage: 0,
  condition: 'good', exterior_color: '', interior_color: '',
  transmission: 'automatic', fuel_type: 'gasoline', drivetrain: 'fwd',
  engine: '', description: '', features: [],
  contact_phone: '', contact_whatsapp: '', contact_city: '', contact_state: '',
};

// =====================================================
// Extracted field components (must be OUTSIDE VehicleForm to avoid remount on every render)
// =====================================================

function SelectField({ label, field, options, placeholder, value, onChange, error, t }: {
  label: string; field: string; options: readonly string[] | string[];
  placeholder?: string; value: string; onChange: (v: string) => void; error?: string;
  t: { has: (key: never) => boolean; (key: never): string };
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2 bg-white/50 dark:bg-am-dark/50 border border-gray-200 dark:border-am-blue/30 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-am-orange/50"
      >
        <option value="">{placeholder || t('form.select' as never)}</option>
        {options.map(opt => (
          <option key={opt} value={opt}>{typeof opt === 'string' && t.has(`specs.${field}.${opt}` as never) ? t(`specs.${field}.${opt}` as never) : opt}</option>
        ))}
      </select>
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  );
}

function InputField({ label, field, type = 'text', placeholder, value, onChange, error, ...props }: {
  label: string; field: string; type?: string; placeholder?: string;
  value: string | number; onChange: (v: string | number) => void; error?: string;
  min?: number; max?: number; step?: number;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(type === 'number' ? Number(e.target.value) : e.target.value)}
        placeholder={placeholder}
        className="w-full px-3 py-2 bg-white/50 dark:bg-am-dark/50 border border-gray-200 dark:border-am-blue/30 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-am-orange/50"
        {...props}
      />
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  );
}

// =====================================================
// Component
// =====================================================

export function VehicleForm({ editVehicleId, initialData, existingImages, onSuccess, onCancel }: VehicleFormProps) {
  const t = useTranslations('inventory');
  const { address: rawAddress } = useAccount();
  const address = rawAddress?.toLowerCase();
  const [currentStep, setCurrentStep] = useState(0);
  const [data, setData] = useState<VehicleFormData>({ ...DEFAULT_DATA, ...initialData });
  const [localImages, setLocalImages] = useState<LocalImage[]>([]);
  const [uploadedImages, setUploadedImages] = useState<UploadedImage[]>(
    (existingImages || []).map(img => ({ id: img.id, public_url: img.public_url, display_order: img.display_order }))
  );
  const [vehicleId, setVehicleId] = useState<string | undefined>(editVehicleId);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isPublishing, setIsPublishing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [prefilled, setPrefilled] = useState(false);

  // Fetch existing vehicle data when editing
  const { data: existingVehicle, isLoading: isLoadingVehicle } = useVehicle(editVehicleId);

  // Fetch seller profile for contact prefill on new vehicles
  useEffect(() => {
    if (!editVehicleId && address && !prefilled) {
      fetch(`/api/sellers?wallet=${address}`)
        .then(res => res.ok ? res.json() : null)
        .then(json => {
          if (json?.data) {
            setData(prev => ({
              ...prev,
              contact_phone: prev.contact_phone || json.data.phone || '',
              contact_whatsapp: prev.contact_whatsapp || json.data.whatsapp || '',
              contact_city: prev.contact_city || json.data.city || 'Houston',
              contact_state: prev.contact_state || json.data.state || 'TX',
            }));
          }
        })
        .catch(() => {});
    }
  }, [editVehicleId, address, prefilled]);

  // Prefill form with existing vehicle data
  useEffect(() => {
    if (existingVehicle && !prefilled) {
      setData({
        vin: existingVehicle.vin || '',
        brand: existingVehicle.brand || '',
        model: existingVehicle.model || '',
        year: existingVehicle.year || new Date().getFullYear(),
        trim: existingVehicle.trim || '',
        body_type: existingVehicle.body_type || '',
        doors: existingVehicle.doors || 4,
        price: existingVehicle.price || 0,
        price_negotiable: existingVehicle.price_negotiable ?? true,
        mileage: existingVehicle.mileage || 0,
        condition: existingVehicle.condition || 'good',
        exterior_color: existingVehicle.exterior_color || '',
        interior_color: existingVehicle.interior_color || '',
        transmission: existingVehicle.transmission || 'automatic',
        fuel_type: existingVehicle.fuel_type || 'gasoline',
        drivetrain: existingVehicle.drivetrain || 'fwd',
        engine: existingVehicle.engine || '',
        description: existingVehicle.description || '',
        features: existingVehicle.features || [],
        contact_phone: existingVehicle.contact_phone || '',
        contact_whatsapp: existingVehicle.contact_whatsapp || '',
        contact_city: existingVehicle.contact_city || '',
        contact_state: existingVehicle.contact_state || '',
      });
      // Prefill existing images
      if (existingVehicle.images && existingVehicle.images.length > 0) {
        setUploadedImages(
          existingVehicle.images.map(img => ({
            id: img.id,
            public_url: img.public_url,
            display_order: img.display_order,
          }))
        );
      }
      setPrefilled(true);
    }
  }, [existingVehicle, prefilled]);

  const createVehicle = useCreateVehicle();
  const updateVehicle = useUpdateVehicle();
  const deleteImage = useDeleteImage();
  const reorderImgs = useReorderImages();

  const step = STEPS[currentStep];

  // Update field
  const setField = useCallback(<K extends keyof VehicleFormData>(key: K, value: VehicleFormData[K]) => {
    setData(prev => ({ ...prev, [key]: value }));
    setErrors(prev => { const next = { ...prev }; delete next[key]; return next; });
  }, []);

  // Toggle feature
  const toggleFeature = useCallback((feature: string) => {
    setData(prev => ({
      ...prev,
      features: prev.features.includes(feature)
        ? prev.features.filter(f => f !== feature)
        : [...prev.features, feature],
    }));
  }, []);

  // Apply VIN data
  const handleVINApply = useCallback((vinData: DecodedVIN) => {
    setData(prev => ({
      ...prev,
      brand: vinData.brand || prev.brand,
      model: vinData.model || prev.model,
      year: vinData.year || prev.year,
      trim: vinData.trim || prev.trim,
      body_type: vinData.body_type || prev.body_type,
      doors: vinData.doors || prev.doors,
      transmission: vinData.transmission || prev.transmission,
      fuel_type: vinData.fuel_type || prev.fuel_type,
      drivetrain: vinData.drivetrain || prev.drivetrain,
      engine: vinData.engine || prev.engine,
    }));
  }, []);

  // Add local images
  const handleAddImages = useCallback((newImages: LocalImage[]) => {
    if (newImages.length > 0) {
      setLocalImages(prev => [...prev, ...newImages]);
    } else {
      // Trigger re-render (for compression status updates)
      setLocalImages(prev => [...prev]);
    }
  }, []);

  // Validate current step
  const validateStep = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (step === 'vehicle') {
      if (!data.brand) newErrors.brand = t('form.required');
      if (!data.model) newErrors.model = t('form.required');
      if (!data.year) newErrors.year = t('form.required');
    }
    if (step === 'specs') {
      if (data.mileage < 0) newErrors.mileage = t('form.required');
    }
    if (step === 'publish') {
      if (!data.price || data.price <= 0) newErrors.price = t('form.required');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Save draft (create or update vehicle)
  const saveDraft = async (): Promise<string | null> => {
    if (!address) return null;

    try {
      if (vehicleId) {
        await updateVehicle.mutateAsync({
          id: vehicleId,
          seller_address: address,
          brand: data.brand,
          model: data.model,
          year: data.year,
          price: data.price || 1,
          mileage: data.mileage,
          price_negotiable: data.price_negotiable,
          condition: (data.condition || 'good') as 'new' | 'like_new' | 'excellent' | 'good' | 'fair',
          vin: data.vin || null,
          trim: data.trim || null,
          body_type: data.body_type || null,
          doors: data.doors || null,
          exterior_color: data.exterior_color || null,
          interior_color: data.interior_color || null,
          transmission: (data.transmission || null) as 'automatic' | 'manual' | 'cvt' | null,
          fuel_type: (data.fuel_type || null) as 'gasoline' | 'diesel' | 'electric' | 'hybrid' | 'plugin_hybrid' | null,
          drivetrain: (data.drivetrain || null) as 'fwd' | 'rwd' | 'awd' | '4wd' | null,
          engine: data.engine || null,
          description: data.description || null,
          features: data.features,
          contact_phone: data.contact_phone || null,
          contact_whatsapp: data.contact_whatsapp || null,
          contact_city: data.contact_city || null,
          contact_state: data.contact_state || null,
        });
        return vehicleId;
      } else {
        const result = await createVehicle.mutateAsync({
          seller_address: address,
          brand: data.brand,
          model: data.model,
          year: data.year,
          price: data.price || 1,
          mileage: data.mileage,
          condition: (data.condition || 'good') as 'new' | 'like_new' | 'excellent' | 'good' | 'fair',
          vin: data.vin || null,
          trim: data.trim || null,
          body_type: data.body_type || null,
          doors: data.doors || null,
          price_negotiable: data.price_negotiable,
          exterior_color: data.exterior_color || null,
          interior_color: data.interior_color || null,
          transmission: (data.transmission || null) as 'automatic' | 'manual' | 'cvt' | null,
          fuel_type: (data.fuel_type || null) as 'gasoline' | 'diesel' | 'electric' | 'hybrid' | 'plugin_hybrid' | null,
          drivetrain: (data.drivetrain || null) as 'fwd' | 'rwd' | 'awd' | '4wd' | null,
          engine: data.engine || null,
          description: data.description || null,
          features: data.features,
          contact_phone: data.contact_phone || null,
          contact_whatsapp: data.contact_whatsapp || null,
          contact_city: data.contact_city || null,
          contact_state: data.contact_state || null,
        });
        setVehicleId(result.id);
        return result.id;
      }
    } catch (err) {
      console.error('[VehicleForm] Save error:', err);
      return null;
    }
  };

  // Navigate steps
  const goNext = async () => {
    if (!validateStep()) return;

    // Auto-save draft on steps 0 and 1
    if (currentStep <= 1) {
      try {
        await saveDraft();
      } catch {
        console.warn('[VehicleForm] Auto-save failed, continuing to next step');
      }
    }

    // On photos step (2): auto-upload pending images before advancing
    if (currentStep === 2) {
      // Wait if images are still compressing
      if (localImages.some(img => img.status === 'compressing')) {
        return; // User sees "Optimizing" overlay — they'll click Next again after
      }

      const readyImages = localImages.filter(img => img.status === 'ready');
      if (readyImages.length > 0) {
        // Ensure we have a vehicleId (auto-save if needed)
        let vId = vehicleId;
        if (!vId) {
          try {
            vId = await saveDraft() ?? undefined;
            if (!vId) return;
          } catch {
            return;
          }
        }
        await handleUploadAll(vId);
      }
    }

    setCurrentStep(prev => Math.min(prev + 1, STEPS.length - 1));
  };

  const goBack = () => setCurrentStep(prev => Math.max(prev - 1, 0));

  // Upload local images — ONE AT A TIME for reliability (stays under Vercel ~4.5MB body limit)
  const handleUploadAll = async (overrideVehicleId?: string) => {
    const vId = overrideVehicleId || vehicleId;
    if (!vId || !address) return;
    const readyImages = localImages.filter(img => img.status === 'ready');
    if (readyImages.length === 0) return;

    setIsUploading(true);

    // Mark all ready images as uploading
    setLocalImages(prev => prev.map(img =>
      img.status === 'ready' ? { ...img, status: 'uploading' as const } : img
    ));

    // Upload each image individually — never exceeds body limit
    for (const img of readyImages) {
      try {
        const blob = img.compressed || img.file;
        const formData = new FormData();
        formData.append('seller', address);
        formData.append('images', blob);

        const res = await fetch(`/api/inventory/${vId}/images`, {
          method: 'POST',
          body: formData,
        });

        const json = await res.json();

        if (res.ok && json.success && json.data?.uploaded?.length > 0) {
          const newUploaded = json.data.uploaded.map((u: { id: string; public_url: string; display_order: number }) => ({
            id: u.id,
            public_url: u.public_url,
            display_order: u.display_order,
          }));
          // Move from local → uploaded (real-time visual feedback)
          setLocalImages(prev => prev.filter(i => i.id !== img.id));
          setUploadedImages(prev => [...prev, ...newUploaded]);
        } else {
          setLocalImages(prev => prev.map(i =>
            i.id === img.id ? { ...i, status: 'error' as const, error: json.error || 'Upload failed' } : i
          ));
        }
      } catch {
        setLocalImages(prev => prev.map(i =>
          i.id === img.id ? { ...i, status: 'error' as const, error: 'Upload failed' } : i
        ));
      }
    }

    setIsUploading(false);
  };

  // Publish
  const handlePublish = async () => {
    if (!validateStep() || !address) return;

    setIsPublishing(true);
    try {
      const id = await saveDraft();
      if (!id) return;

      // Upload remaining ready images (pass id to avoid stale state)
      if (localImages.some(img => img.status === 'ready')) {
        await handleUploadAll(id);
      }

      // Change status to active
      const statusRes = await fetch(`/api/inventory/${id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ seller: address, status: 'active' }),
      });

      if (!statusRes.ok) {
        const errBody = await statusRes.json().catch(() => ({}));
        console.error('[VehicleForm] Status change failed:', errBody);
      }

      onSuccess(id);
    } catch (err) {
      console.error('[VehicleForm] Publish error:', err);
    } finally {
      setIsPublishing(false);
    }
  };

  // Save as draft
  const handleSaveDraft = async () => {
    if (!address) return;
    setIsPublishing(true);
    try {
      const id = await saveDraft();
      if (!id) return;
      if (localImages.some(img => img.status === 'ready')) await handleUploadAll(id);
      onSuccess(id);
    } finally {
      setIsPublishing(false);
    }
  };

  const isSaving = createVehicle.isPending || updateVehicle.isPending || isPublishing || isUploading;

  // Helper to create props for SelectField
  const selectProps = (field: keyof VehicleFormData) => ({
    field,
    value: String(data[field] ?? ''),
    onChange: (v: string) => {
      // Convert to number for numeric fields
      const numericFields: (keyof VehicleFormData)[] = ['year', 'doors'];
      const val = numericFields.includes(field) && v !== '' ? Number(v) : v;
      setField(field, val as never);
    },
    error: errors[field],
    t: t as unknown as { has: (key: never) => boolean; (key: never): string },
  });

  // Helper to create props for InputField
  const inputProps = (field: keyof VehicleFormData, type: string = 'text') => ({
    field,
    type,
    value: data[field] as string | number,
    onChange: (v: string | number) => setField(field, v as never),
    error: errors[field],
  });

  // ===================================================
  // Render steps
  // ===================================================

  // Show loading state while fetching existing vehicle data for edit
  if (editVehicleId && isLoadingVehicle) {
    return (
      <div className="glass-crystal-enhanced rounded-2xl p-12 text-center">
        <Loader2 className="w-8 h-8 animate-spin mx-auto text-am-orange mb-3" />
        <p className="text-sm text-gray-500 dark:text-gray-400">{t('list.loading')}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Progress stepper */}
      <div className="flex items-center justify-between">
        {STEPS.map((s, i) => {
          const Icon = STEP_ICONS[s];
          const isActive = i === currentStep;
          const isDone = i < currentStep;
          return (
            <React.Fragment key={s}>
              <div className="flex flex-col items-center gap-1">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all
                  ${isActive ? 'bg-am-orange text-white scale-110' : isDone ? 'bg-am-green text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-400'}
                `}>
                  {isDone ? <Check className="w-5 h-5" /> : <Icon className="w-5 h-5" />}
                </div>
                <span className={`text-xs font-medium ${isActive ? 'text-am-orange' : 'text-gray-400'}`}>
                  {t(`steps.${s}`)}
                </span>
              </div>
              {i < STEPS.length - 1 && (
                <div className={`flex-1 h-0.5 mx-2 rounded ${i < currentStep ? 'bg-am-green' : 'bg-gray-200 dark:bg-gray-700'}`} />
              )}
            </React.Fragment>
          );
        })}
      </div>

      {/* Step content */}
      <div className="glass-crystal-enhanced rounded-2xl p-6">
        {/* STEP 1: Vehicle identification */}
        {step === 'vehicle' && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{t('steps.vehicleTitle')}</h2>
            <VINDecoder onApply={(vinData) => {
              handleVINApply(vinData);
              if (vinData.brand) setField('vin', data.vin);
            }} />
            <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">{t('steps.manualEntry')}</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <SelectField label={t('form.brand')} {...selectProps('brand')} options={POPULAR_BRANDS} />
                <InputField label={t('form.model')} {...inputProps('model')} placeholder="Camry, F-150, Civic..." />
                <SelectField label={t('form.year')} {...selectProps('year')} options={getYearOptions().map(String)} />
                <InputField label={t('form.trim')} {...inputProps('trim')} placeholder="SE, XLE, Limited..." />
              </div>
            </div>
          </div>
        )}

        {/* STEP 2: Specifications */}
        {step === 'specs' && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{t('steps.specsTitle')}</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <InputField label={t('form.mileage')} {...inputProps('mileage', 'number')} min={0} placeholder="45000" />
              <SelectField label={t('form.condition')} {...selectProps('condition')} options={['new', 'like_new', 'excellent', 'good', 'fair']} />
              <SelectField label={t('form.transmission')} {...selectProps('transmission')} options={['automatic', 'manual', 'cvt']} />
              <SelectField label={t('form.fuelType')} {...selectProps('fuel_type')} options={['gasoline', 'diesel', 'electric', 'hybrid', 'plugin_hybrid']} />
              <SelectField label={t('form.drivetrain')} {...selectProps('drivetrain')} options={['fwd', 'rwd', 'awd', '4wd']} />
              <SelectField label={t('form.bodyType')} {...selectProps('body_type')} options={BODY_TYPES} />
              <SelectField label={t('form.exteriorColor')} {...selectProps('exterior_color')} options={EXTERIOR_COLORS} />
              <SelectField label={t('form.interiorColor')} {...selectProps('interior_color')} options={INTERIOR_COLORS} />
              <InputField label={t('form.engine')} {...inputProps('engine')} placeholder="2.5L 4-Cylinder" />
              <InputField label={t('form.doors')} {...inputProps('doors', 'number')} min={1} max={6} />
            </div>
            {/* Features checkboxes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t('form.features')}</label>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                {VEHICLE_FEATURES.map(feature => (
                  <label key={feature} className="flex items-center gap-2 cursor-pointer text-sm">
                    <input
                      type="checkbox"
                      checked={data.features.includes(feature)}
                      onChange={() => toggleFeature(feature)}
                      className="rounded border-gray-300 text-am-orange focus:ring-am-orange"
                    />
                    <span className="text-gray-700 dark:text-gray-300">{feature}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* STEP 3: Photos */}
        {step === 'photos' && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{t('steps.photosTitle')}</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">{t('steps.photosDesc')}</p>
            <ImageUploader
              localImages={localImages}
              uploadedImages={uploadedImages}
              onAddFiles={handleAddImages}
              onRemoveLocal={(id) => setLocalImages(prev => prev.filter(img => img.id !== id))}
              onRemoveUploaded={(id) => {
                if (vehicleId && address) {
                  deleteImage.mutate({ vehicleId, imageId: id, seller: address });
                  setUploadedImages(prev => prev.filter(img => img.id !== id));
                }
              }}
              onReorder={(ids) => {
                const reordered = ids.map(id => uploadedImages.find(img => img.id === id)!).filter(Boolean);
                setUploadedImages(reordered);
                if (vehicleId && address) {
                  reorderImgs.mutate({ vehicleId, seller: address, imageIds: ids });
                }
              }}
            />
            {localImages.length > 0 && (
              <button
                onClick={() => handleUploadAll()}
                disabled={isUploading || !localImages.some(img => img.status === 'ready')}
                className="w-full py-2 bg-am-blue hover:bg-am-blue-light text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                {t('images.upload')} ({localImages.filter(img => img.status === 'ready').length})
              </button>
            )}
          </div>
        )}

        {/* STEP 4: Price & Publish */}
        {step === 'publish' && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{t('steps.publishTitle')}</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('form.price')}</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-medium">$</span>
                  <input
                    type="number"
                    value={data.price || ''}
                    onChange={(e) => setField('price', Number(e.target.value))}
                    placeholder="25000"
                    min={1}
                    className="w-full pl-8 pr-3 py-2 bg-white/50 dark:bg-am-dark/50 border border-gray-200 dark:border-am-blue/30 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-am-orange/50"
                  />
                </div>
                {errors.price && <p className="text-xs text-red-500 mt-1">{errors.price}</p>}
              </div>
              <div className="flex items-end">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={data.price_negotiable}
                    onChange={(e) => setField('price_negotiable', e.target.checked)}
                    className="rounded border-gray-300 text-am-orange focus:ring-am-orange"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">{t('form.negotiable')}</span>
                </label>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('form.description')}</label>
              <textarea
                value={data.description}
                onChange={(e) => setField('description', e.target.value)}
                rows={4}
                maxLength={5000}
                placeholder={t('form.descriptionPlaceholder')}
                className="w-full px-3 py-2 bg-white/50 dark:bg-am-dark/50 border border-gray-200 dark:border-am-blue/30 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-am-orange/50 resize-none"
              />
            </div>
            {/* Contact Information */}
            <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
              <div className="flex items-center gap-2 mb-3">
                <Phone className="w-4 h-4 text-am-orange" />
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white">{t('form.contactSection')}</h3>
              </div>
              <p className="text-xs text-gray-400 dark:text-gray-500 mb-3">{t('form.contactHint')}</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <InputField label={t('form.contactPhone')} field="contact_phone" value={data.contact_phone} onChange={(v) => setField('contact_phone', String(v))} placeholder="+1 832 000 0000" />
                <InputField label={t('form.contactWhatsApp')} field="contact_whatsapp" value={data.contact_whatsapp} onChange={(v) => setField('contact_whatsapp', String(v))} placeholder="18320000000" />
                <div className="flex items-center gap-2">
                  <div className="flex-1">
                    <InputField label={t('form.contactCity')} field="contact_city" value={data.contact_city} onChange={(v) => setField('contact_city', String(v))} placeholder="Houston" />
                  </div>
                  <div className="w-24">
                    <InputField label={t('form.contactState')} field="contact_state" value={data.contact_state} onChange={(v) => setField('contact_state', String(v))} placeholder="TX" />
                  </div>
                </div>
              </div>
            </div>

            {/* Summary */}
            <div className="glass-crystal rounded-xl p-4 space-y-2">
              <h3 className="font-medium text-gray-900 dark:text-white text-sm">{t('steps.summary')}</h3>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div><span className="text-gray-500">{t('form.brand')}: </span><span className="font-medium text-gray-900 dark:text-white">{data.brand || '—'}</span></div>
                <div><span className="text-gray-500">{t('form.model')}: </span><span className="font-medium text-gray-900 dark:text-white">{data.model || '—'}</span></div>
                <div><span className="text-gray-500">{t('form.year')}: </span><span className="font-medium text-gray-900 dark:text-white">{data.year || '—'}</span></div>
                <div><span className="text-gray-500">{t('form.mileage')}: </span><span className="font-medium text-gray-900 dark:text-white">{data.mileage ? `${data.mileage.toLocaleString()} mi` : '—'}</span></div>
                <div><span className="text-gray-500">{t('images.photos')}: </span><span className="font-medium text-gray-900 dark:text-white">{uploadedImages.length + localImages.length}</span></div>
                <div><span className="text-gray-500">{t('form.features')}: </span><span className="font-medium text-gray-900 dark:text-white">{data.features.length}</span></div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between gap-3">
        <button
          onClick={currentStep === 0 ? onCancel : goBack}
          className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors flex items-center gap-1"
        >
          <ChevronLeft className="w-4 h-4" />
          {currentStep === 0 ? t('actions.cancel') : t('actions.back')}
        </button>

        <div className="flex items-center gap-2">
          {step === 'publish' && (
            <button
              onClick={handleSaveDraft}
              disabled={isSaving}
              className="px-4 py-2 text-sm font-medium border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg transition-colors"
            >
              {t('actions.saveDraft')}
            </button>
          )}
          {step !== 'publish' ? (
            <button
              onClick={goNext}
              disabled={isSaving}
              className="px-6 py-2 bg-am-orange hover:bg-am-orange-light text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-1 disabled:opacity-50"
            >
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              {t('actions.next')}
              <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={handlePublish}
              disabled={isSaving || !data.price}
              className="px-6 py-2 bg-gradient-to-r from-am-green to-emerald-500 hover:from-am-green/90 hover:to-emerald-500/90 text-white rounded-lg text-sm font-bold transition-all flex items-center gap-2 disabled:opacity-50"
            >
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
              {t('actions.publish')}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

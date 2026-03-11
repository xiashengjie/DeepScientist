/**
 * AutoFigure Settings Store
 *
 * Zustand store for managing AutoFigure configuration settings.
 * Settings are persisted to localStorage.
 *
 * @module lib/stores/autofigure-settings
 */

import { create } from "zustand";
import { persist } from "zustand/middleware";

// ============================================================
// Types
// ============================================================

export type LLMProvider = "openrouter" | "gemini";
export type ImageGenProvider = "openrouter" | "gemini";
export type EnhancementMode = "none" | "code2prompt";

export interface AutoFigureSettings {
  // ===== Layout Generation LLM Config =====
  layoutGenProvider: LLMProvider;
  layoutGenApiKey: string;
  layoutGenBaseUrl: string;
  layoutGenModel: string;
  iterationModel: string;  // Model for iteration phase (defaults to layoutGenModel if empty)

  // ===== Methodology Extraction LLM Config (for papers) =====
  enableMethodologyExtraction: boolean;
  methodologyProvider: LLMProvider;
  methodologyApiKey: string;
  methodologyModel: string;

  // ===== Image Enhancement/Beautification Config =====
  enhancementMode: EnhancementMode;
  artStyle: string;
  enhancementCount: number;

  // Enhancement LLM (for code2prompt)
  enhancementProvider: LLMProvider;
  enhancementApiKey: string;
  enhancementModel: string;
  enhancementBaseUrl: string;

  // Image Generation API
  imageGenProvider: ImageGenProvider;
  imageGenApiKey: string;
  imageGenModel: string;
  imageGenBaseUrl: string;

  // PPTX Export
  pptxExportEnabled: boolean;
  pptxExportMode: "per_iteration" | "cumulative";
  pptxIncludeMetadata: boolean;
}

interface AutoFigureSettingsStore extends AutoFigureSettings {
  updateSettings: (updates: Partial<AutoFigureSettings>) => void;
  resetSettings: () => void;
  isConfigured: () => boolean;
}

// ============================================================
// Default Values
// ============================================================

const defaultSettings: AutoFigureSettings = {
  // Layout Generation LLM
  layoutGenProvider: "gemini",
  layoutGenApiKey: "",
  layoutGenBaseUrl: "",
  layoutGenModel: "gemini-3-pro-preview",
  iterationModel: "",  // Empty means use same model as layoutGenModel

  // Methodology Extraction
  enableMethodologyExtraction: true,
  methodologyProvider: "gemini",
  methodologyApiKey: "",
  methodologyModel: "gemini-3.0-flash-preview",

  // Image Enhancement
  enhancementMode: "code2prompt",
  artStyle: "",
  enhancementCount: 1,
  enhancementProvider: "gemini",
  enhancementApiKey: "",
  enhancementModel: "gemini-3-pro-preview",
  enhancementBaseUrl: "",
  imageGenProvider: "gemini",
  imageGenApiKey: "",
  imageGenModel: "gemini-3-pro-image-preview",
  imageGenBaseUrl: "",
  pptxExportEnabled: false,
  pptxExportMode: "per_iteration",
  pptxIncludeMetadata: false,
};

// ============================================================
// Store
// ============================================================

export const useAutoFigureSettings = create<AutoFigureSettingsStore>()(
  persist(
    (set, get) => ({
      ...defaultSettings,

      updateSettings: (updates) =>
        set((state) => ({ ...state, ...updates })),

      resetSettings: () => set(defaultSettings),

      isConfigured: () => {
        const state = get();
        return state.layoutGenApiKey.trim().length > 0;
      },
    }),
    {
      name: "ds-autofigure-settings",
    }
  )
);

// ============================================================
// Provider Options (for UI)
// ============================================================

export const LLM_PROVIDERS: Array<{
  value: LLMProvider;
  label: string;
  description: string;
}> = [
  { value: "openrouter", label: "OpenRouter", description: "Multi-model router" },
  { value: "gemini", label: "Google Gemini", description: "Google Gemini" },
];

export const IMAGE_GEN_PROVIDERS: Array<{
  value: ImageGenProvider;
  label: string;
  models: string[];
}> = [
  { value: "openrouter", label: "OpenRouter", models: ["google/gemini-3-pro-image-preview"] },
  { value: "gemini", label: "Google Gemini", models: ["gemini-3-pro-image-preview"] },
];

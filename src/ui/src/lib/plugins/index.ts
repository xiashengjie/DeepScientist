/**
 * Built-in Plugins Registry
 *
 * Central export point for all built-in plugins in DeepScientist.
 * Each plugin follows the "Everything is a Plugin" architecture.
 *
 * @module lib/plugins
 */

import type { UnifiedPluginManifest, PluginComponentProps } from "@/lib/types/plugin";
import type { ComponentType } from "react";

// ============================================================
// Import Plugin Manifests
// ============================================================

import { codeEditorManifest } from "./code-editor/manifest";
import { codeViewerManifest } from "./code-viewer/manifest";
import { textViewerManifest } from "./text-viewer/manifest";
import { pdfViewerManifest } from "./pdf-viewer/manifest";
import { pdfMarkdownManifest } from "./pdf-markdown/manifest";
import { markdownViewerManifest } from "./markdown-viewer/manifest";
import { imageViewerManifest } from "./image-viewer/manifest";
import { docViewerManifest } from "./doc-viewer/manifest";
import { cliPluginManifest } from "./cli/manifest";
import { labPluginManifest } from "./lab/manifest";

// ============================================================
// Import Plugin Components (lazy loading recommended for production)
// ============================================================

import CodeEditorPlugin from "./code-editor/CodeEditorPlugin";
import CodeViewerPlugin from "./code-viewer/CodeViewerPlugin";
import TextViewerPlugin from "./text-viewer/TextViewerPlugin";
import PdfViewerPlugin from "./pdf-viewer/PdfViewerPlugin";
import PdfMarkdownPlugin from "./pdf-markdown/PdfMarkdownPlugin";
import MarkdownViewerPlugin from "./markdown-viewer/MarkdownViewerPlugin";
import ImageViewerPlugin from "./image-viewer/ImageViewerPlugin";
import DocViewerPlugin from "./doc-viewer/DocViewerPlugin";
import CliPlugin from "./cli/CliPlugin";
import LabPlugin from "./lab/LabPlugin";

// ============================================================
// Plugin Registry Types
// ============================================================

/**
 * Registered plugin with component
 */
export interface RegisteredPlugin {
  manifest: UnifiedPluginManifest;
  component: ComponentType<PluginComponentProps>;
}

/**
 * Plugin registry map
 */
export type PluginRegistry = Map<string, RegisteredPlugin>;

// ============================================================
// Built-in Plugin IDs
// ============================================================

/**
 * Built-in plugin ID constants
 */
export const BUILTIN_PLUGIN_IDS = {
  LAB: "@ds/plugin-lab",
  CODE_EDITOR: "@ds/plugin-code-editor",
  CODE_VIEWER: "@ds/plugin-code-viewer",
  TEXT_VIEWER: "@ds/plugin-text-viewer",
  PDF_VIEWER: "@ds/plugin-pdf-viewer",
  PDF_MARKDOWN: "@ds/plugin-pdf-markdown",
  MARKDOWN_VIEWER: "@ds/plugin-markdown-viewer",
  IMAGE_VIEWER: "@ds/plugin-image-viewer",
  DOC_VIEWER: "@ds/plugin-doc-viewer",
  CLI: "@ds/plugin-cli",
  // Future plugins:
  // NOTEBOOK: "@ds/plugin-notebook",
  // SETTINGS: "@ds/plugin-settings",
} as const;

// ============================================================
// Export All Manifests
// ============================================================

/**
 * All built-in plugin manifests
 */
export const builtinManifests: UnifiedPluginManifest[] = [
  labPluginManifest,
  codeEditorManifest,
  codeViewerManifest,
  textViewerManifest,
  pdfViewerManifest,
  pdfMarkdownManifest,
  markdownViewerManifest,
  imageViewerManifest,
  docViewerManifest,
  cliPluginManifest,
];

/**
 * Manifest lookup by plugin ID
 */
export const manifestById: Record<string, UnifiedPluginManifest> = {
  [BUILTIN_PLUGIN_IDS.LAB]: labPluginManifest,
  [BUILTIN_PLUGIN_IDS.CODE_EDITOR]: codeEditorManifest,
  [BUILTIN_PLUGIN_IDS.CODE_VIEWER]: codeViewerManifest,
  [BUILTIN_PLUGIN_IDS.TEXT_VIEWER]: textViewerManifest,
  [BUILTIN_PLUGIN_IDS.PDF_VIEWER]: pdfViewerManifest,
  [BUILTIN_PLUGIN_IDS.PDF_MARKDOWN]: pdfMarkdownManifest,
  [BUILTIN_PLUGIN_IDS.MARKDOWN_VIEWER]: markdownViewerManifest,
  [BUILTIN_PLUGIN_IDS.IMAGE_VIEWER]: imageViewerManifest,
  [BUILTIN_PLUGIN_IDS.DOC_VIEWER]: docViewerManifest,
  [BUILTIN_PLUGIN_IDS.CLI]: cliPluginManifest,
};

// ============================================================
// Export All Components
// ============================================================

/**
 * Component lookup by plugin ID
 */
export const componentById: Record<string, ComponentType<PluginComponentProps>> = {
  [BUILTIN_PLUGIN_IDS.LAB]: LabPlugin,
  [BUILTIN_PLUGIN_IDS.CODE_EDITOR]: CodeEditorPlugin,
  [BUILTIN_PLUGIN_IDS.CODE_VIEWER]: CodeViewerPlugin,
  [BUILTIN_PLUGIN_IDS.TEXT_VIEWER]: TextViewerPlugin,
  [BUILTIN_PLUGIN_IDS.PDF_VIEWER]: PdfViewerPlugin,
  [BUILTIN_PLUGIN_IDS.PDF_MARKDOWN]: PdfMarkdownPlugin,
  [BUILTIN_PLUGIN_IDS.MARKDOWN_VIEWER]: MarkdownViewerPlugin,
  [BUILTIN_PLUGIN_IDS.IMAGE_VIEWER]: ImageViewerPlugin,
  [BUILTIN_PLUGIN_IDS.DOC_VIEWER]: DocViewerPlugin,
  [BUILTIN_PLUGIN_IDS.CLI]: CliPlugin,
};

// ============================================================
// Plugin Registry Functions
// ============================================================

/**
 * Create a plugin registry with all built-in plugins
 */
export function createBuiltinPluginRegistry(): PluginRegistry {
  const registry: PluginRegistry = new Map();

  // Register Lab plugin
  registry.set(BUILTIN_PLUGIN_IDS.LAB, {
    manifest: labPluginManifest,
    component: LabPlugin,
  });

  // Register Code Editor plugin
  registry.set(BUILTIN_PLUGIN_IDS.CODE_EDITOR, {
    manifest: codeEditorManifest,
    component: CodeEditorPlugin,
  });

  // Register Code Viewer plugin
  registry.set(BUILTIN_PLUGIN_IDS.CODE_VIEWER, {
    manifest: codeViewerManifest,
    component: CodeViewerPlugin,
  });

  // Register Text Viewer plugin
  registry.set(BUILTIN_PLUGIN_IDS.TEXT_VIEWER, {
    manifest: textViewerManifest,
    component: TextViewerPlugin,
  });

  // Register PDF Viewer plugin
  registry.set(BUILTIN_PLUGIN_IDS.PDF_VIEWER, {
    manifest: pdfViewerManifest,
    component: PdfViewerPlugin,
  });

  // Register PDF Markdown plugin
  registry.set(BUILTIN_PLUGIN_IDS.PDF_MARKDOWN, {
    manifest: pdfMarkdownManifest,
    component: PdfMarkdownPlugin,
  });

  // Register Markdown Viewer plugin
  registry.set(BUILTIN_PLUGIN_IDS.MARKDOWN_VIEWER, {
    manifest: markdownViewerManifest,
    component: MarkdownViewerPlugin,
  });

  // Register Image Viewer plugin
  registry.set(BUILTIN_PLUGIN_IDS.IMAGE_VIEWER, {
    manifest: imageViewerManifest,
    component: ImageViewerPlugin,
  });

  // Register Document Viewer plugin
  registry.set(BUILTIN_PLUGIN_IDS.DOC_VIEWER, {
    manifest: docViewerManifest,
    component: DocViewerPlugin,
  });

  // Register CLI plugin
  registry.set(BUILTIN_PLUGIN_IDS.CLI, {
    manifest: cliPluginManifest,
    component: CliPlugin,
  });

  return registry;
}

/**
 * Get plugin by ID from the built-in registry
 */
export function getBuiltinPlugin(pluginId: string): RegisteredPlugin | null {
  const manifest = manifestById[pluginId];
  const component = componentById[pluginId];

  if (manifest && component) {
    return { manifest, component };
  }

  return null;
}

/**
 * Get plugin component by ID
 */
export function getBuiltinPluginComponent(
  pluginId: string
): ComponentType<PluginComponentProps> | null {
  return componentById[pluginId] || null;
}

/**
 * Get plugin manifest by ID
 */
export function getBuiltinPluginManifest(pluginId: string): UnifiedPluginManifest | null {
  return manifestById[pluginId] || null;
}

/**
 * Find plugin that can handle a file by MIME type and/or file name
 *
 * @param mimeType - File MIME type
 * @param fileName - File name (for extension matching)
 * @returns Plugin manifest with highest priority, or null if none found
 */
export function findPluginForFile(
  mimeType?: string,
  fileName?: string
): UnifiedPluginManifest | null {
  let bestMatch: UnifiedPluginManifest | null = null;
  let bestPriority = -1;

  const extension = fileName
    ? fileName.substring(fileName.lastIndexOf(".")).toLowerCase()
    : null;

  for (const manifest of builtinManifests) {
    const associations = manifest.frontend?.fileAssociations;
    if (!associations) continue;

    for (const assoc of associations) {
      // Check MIME type match
      const mimeMatch = mimeType && assoc.mimeTypes?.includes(mimeType);

      // Check extension match
      const extMatch = extension && assoc.extensions.some(
        (ext) => ext.toLowerCase() === extension
      );

      if ((mimeMatch || extMatch) && assoc.priority > bestPriority) {
        bestMatch = manifest;
        bestPriority = assoc.priority;
      }
    }
  }

  return bestMatch;
}

/**
 * Get all file associations from all plugins
 *
 * @returns Map of extension -> plugin ID (highest priority wins)
 */
export function getAllFileAssociations(): Map<string, string> {
  const associations = new Map<string, { pluginId: string; priority: number }>();

  for (const manifest of builtinManifests) {
    const fileAssociations = manifest.frontend?.fileAssociations;
    if (!fileAssociations) continue;

    for (const assoc of fileAssociations) {
      for (const ext of assoc.extensions) {
        const normalizedExt = ext.toLowerCase();
        const existing = associations.get(normalizedExt);

        if (!existing || assoc.priority > existing.priority) {
          associations.set(normalizedExt, {
            pluginId: manifest.id,
            priority: assoc.priority,
          });
        }
      }
    }
  }

  // Convert to simple extension -> pluginId map
  const result = new Map<string, string>();
  associations.forEach((value, ext) => {
    result.set(ext, value.pluginId);
  });

  return result;
}

// ============================================================
// Re-exports for convenience
// ============================================================

// Code Viewer plugin
export { codeViewerManifest } from "./code-viewer/manifest";
export { default as CodeViewerPlugin } from "./code-viewer/CodeViewerPlugin";

// Text Viewer plugin
export { textViewerManifest } from "./text-viewer/manifest";
export { default as TextViewerPlugin } from "./text-viewer/TextViewerPlugin";

// PDF Viewer plugin
export { pdfViewerManifest } from "./pdf-viewer/manifest";
export { default as PdfViewerPlugin } from "./pdf-viewer/PdfViewerPlugin";

// Markdown Viewer plugin
export { markdownViewerManifest } from "./markdown-viewer/manifest";
export { default as MarkdownViewerPlugin } from "./markdown-viewer/MarkdownViewerPlugin";

// Image Viewer plugin
export { imageViewerManifest } from "./image-viewer/manifest";
export { default as ImageViewerPlugin } from "./image-viewer/ImageViewerPlugin";

// Document Viewer plugin
export { docViewerManifest } from "./doc-viewer/manifest";
export { default as DocViewerPlugin } from "./doc-viewer/DocViewerPlugin";

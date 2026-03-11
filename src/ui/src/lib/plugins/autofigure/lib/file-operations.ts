/**
 * AutoFigure File Operations
 *
 * Utilities for saving PDFs and generated images to the DeepScientist file system.
 * - PDFs are saved to /AutoFigure/PDF/
 * - Images are saved to /AutoFigure/Image/{sessionId}/
 *
 * @module lib/plugins/autofigure/lib/file-operations
 */

import * as fileApi from "@/lib/api/files";
import { useFileTreeStore } from "@/lib/stores/file-tree";

// ============================================================
// Constants
// ============================================================

const AUTOFIGURE_ROOT = "AutoFigure";
const PDF_FOLDER = "PDF";
const TEXT_FOLDER = "Text";
const IMAGE_FOLDER = "Image";

// ============================================================
// Helper Functions
// ============================================================

/**
 * Find a folder by path in the file tree
 */
function findFolderByPath(path: string): { id: string; name: string } | null {
  const node = useFileTreeStore.getState().findNodeByPath(path);
  if (node && node.type === "folder") {
    return { id: node.id, name: node.name };
  }
  return null;
}

/**
 * Find a folder by name under a parent
 */
async function findChildFolder(
  projectId: string,
  parentId: string | null,
  folderName: string
): Promise<{ id: string; name: string } | null> {
  try {
    const files = await fileApi.listFiles(projectId, parentId);
    const folder = files.find(
      (f) => f.type === "folder" && f.name === folderName
    );
    if (folder) {
      return { id: folder.id, name: folder.name };
    }
  } catch (error) {
    console.error("[AutoFigure] Error finding folder:", error);
  }
  return null;
}

/**
 * Find a file by name under a parent folder
 */
async function findChildFile(
  projectId: string,
  parentId: string | null,
  fileName: string
): Promise<{ id: string; name: string } | null> {
  try {
    const files = await fileApi.listFiles(projectId, parentId);
    const file = files.find(
      (f) => f.type === "file" && f.name === fileName
    );
    if (file) {
      return { id: file.id, name: file.name };
    }
  } catch (error) {
    console.error("[AutoFigure] Error finding file:", error);
  }
  return null;
}

/**
 * Create a folder if it doesn't exist
 */
async function ensureFolder(
  projectId: string,
  parentId: string | null,
  folderName: string
): Promise<string> {
  // First try to find existing folder
  const existing = await findChildFolder(projectId, parentId, folderName);
  if (existing) {
    return existing.id;
  }

  // Create the folder
  const created = await fileApi.createFolder(projectId, {
    name: folderName,
    parent_id: parentId,
  });

  return created.id;
}

// ============================================================
// Public API
// ============================================================

/**
 * Ensure the AutoFigure directory structure exists
 * Creates /AutoFigure/PDF and /AutoFigure/Image if they don't exist
 *
 * @param projectId - The current project ID
 * @returns Object containing folder IDs for root, PDF, and Image folders
 */
export async function ensureAutoFigureDirectories(projectId: string): Promise<{
  rootId: string;
  pdfFolderId: string;
  textFolderId: string;
  imageFolderId: string;
}> {
  // Create or find /AutoFigure
  const rootId = await ensureFolder(projectId, null, AUTOFIGURE_ROOT);

  // Create or find /AutoFigure/PDF
  const pdfFolderId = await ensureFolder(projectId, rootId, PDF_FOLDER);

  // Create or find /AutoFigure/Text
  const textFolderId = await ensureFolder(projectId, rootId, TEXT_FOLDER);

  // Create or find /AutoFigure/Image
  const imageFolderId = await ensureFolder(projectId, rootId, IMAGE_FOLDER);

  // Refresh file tree to reflect changes
  await useFileTreeStore.getState().refresh();

  return { rootId, pdfFolderId, textFolderId, imageFolderId };
}

/**
 * Ensure a session-specific image folder exists
 * Creates /AutoFigure/Image/{sessionId} if it doesn't exist
 *
 * @param projectId - The current project ID
 * @param sessionId - The AutoFigure session ID
 * @returns The folder ID for the session image folder
 */
export async function ensureSessionImageFolder(
  projectId: string,
  sessionId: string
): Promise<string> {
  // First ensure the parent structure exists
  const { imageFolderId } = await ensureAutoFigureDirectories(projectId);

  // Create or find /AutoFigure/Image/{sessionId}
  const sessionFolderId = await ensureFolder(projectId, imageFolderId, sessionId);

  // Refresh file tree
  await useFileTreeStore.getState().refresh();

  return sessionFolderId;
}

/**
 * Save a PDF file to /AutoFigure/PDF/
 *
 * @param projectId - The current project ID
 * @param file - The PDF File object to save
 * @param onProgress - Optional progress callback (0-100)
 * @returns The created file metadata
 */
export async function savePdfToAutoFigure(
  projectId: string,
  file: File,
  onProgress?: (progress: number) => void
): Promise<{ id: string; name: string; path: string }> {
  // Ensure directories exist
  const { pdfFolderId } = await ensureAutoFigureDirectories(projectId);

  // Upload the PDF
  const uploaded = await fileApi.uploadFileAuto(
    projectId,
    file,
    pdfFolderId,
    onProgress
  );

  // Refresh file tree
  await useFileTreeStore.getState().refresh();

  return {
    id: uploaded.id,
    name: uploaded.name,
    path: uploaded.path || `/${AUTOFIGURE_ROOT}/${PDF_FOLDER}/${uploaded.name}`,
  };
}

/**
 * Save extracted text to /AutoFigure/Text/
 *
 * @param projectId - The current project ID
 * @param text - Extracted text content
 * @param fileName - Target file name (e.g., "paper.txt")
 * @returns The created file metadata
 */
export async function saveTextToAutoFigure(
  projectId: string,
  text: string,
  fileName: string
): Promise<{ id: string; name: string; path: string }> {
  const { textFolderId } = await ensureAutoFigureDirectories(projectId);
  const blob = new Blob([text], { type: "text/plain" });
  const uploadFile = new File([blob], fileName, { type: "text/plain" });
  const uploaded = await fileApi.uploadFileAuto(
    projectId,
    uploadFile,
    textFolderId
  );

  await useFileTreeStore.getState().refresh();

  return {
    id: uploaded.id,
    name: uploaded.name,
    path: uploaded.path || `/${AUTOFIGURE_ROOT}/${TEXT_FOLDER}/${uploaded.name}`,
  };
}

/**
 * Save an image to /AutoFigure/Image/{sessionId}/
 * If file already exists, delete it first and then upload the new one.
 *
 * @param projectId - The current project ID
 * @param sessionId - The AutoFigure session ID
 * @param imageBlob - The image Blob to save
 * @param fileName - The file name (e.g., "iteration_1.png", "final.png", "enhanced_1.png")
 * @param onProgress - Optional progress callback (0-100)
 * @returns The created file metadata
 */
export async function saveImageToAutoFigure(
  projectId: string,
  sessionId: string,
  imageBlob: Blob,
  fileName: string,
  onProgress?: (progress: number) => void
): Promise<{ id: string; name: string; path: string }> {
  // Ensure session folder exists
  const sessionFolderId = await ensureSessionImageFolder(projectId, sessionId);

  // Check if file already exists, delete it first (for binary files, we replace by delete+upload)
  const existingFile = await findChildFile(projectId, sessionFolderId, fileName);
  if (existingFile) {
    console.log(`[AutoFigure FileOps] Deleting existing file before re-upload: ${fileName}`);
    try {
      await fileApi.deleteFiles([existingFile.id], true); // permanent delete
    } catch (error) {
      console.warn(`[AutoFigure FileOps] Failed to delete existing file: ${fileName}`, error);
    }
  }

  // Convert Blob to File
  const file = new File([imageBlob], fileName, { type: imageBlob.type || "image/png" });

  // Upload the image
  const uploaded = await fileApi.uploadFileAuto(
    projectId,
    file,
    sessionFolderId,
    onProgress
  );

  // Refresh file tree
  await useFileTreeStore.getState().refresh();

  return {
    id: uploaded.id,
    name: uploaded.name,
    path: uploaded.path || `/${AUTOFIGURE_ROOT}/${IMAGE_FOLDER}/${sessionId}/${uploaded.name}`,
  };
}

/**
 * Save a base64-encoded image to /AutoFigure/Image/{sessionId}/
 *
 * @param projectId - The current project ID
 * @param sessionId - The AutoFigure session ID
 * @param base64Data - The base64-encoded image data (without data URL prefix)
 * @param fileName - The file name (e.g., "iteration_1.png")
 * @param mimeType - The image MIME type (default: "image/png")
 * @returns The created file metadata
 */
export async function saveBase64ImageToAutoFigure(
  projectId: string,
  sessionId: string,
  base64Data: string,
  fileName: string,
  mimeType: string = "image/png"
): Promise<{ id: string; name: string; path: string }> {
  // Convert base64 to Blob
  const binaryString = atob(base64Data);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  const blob = new Blob([bytes], { type: mimeType });

  return saveImageToAutoFigure(projectId, sessionId, blob, fileName);
}

/**
 * Save an XML/text file to /AutoFigure/Image/{sessionId}/
 * If file already exists, update its content instead of creating a new one.
 *
 * @param projectId - The current project ID
 * @param sessionId - The AutoFigure session ID
 * @param content - The text content to save
 * @param fileName - The file name (e.g., "iteration_1.xml", "final.xml")
 * @returns The created/updated file metadata
 */
export async function saveXmlToAutoFigure(
  projectId: string,
  sessionId: string,
  content: string,
  fileName: string
): Promise<{ id: string; name: string; path: string }> {
  // Ensure session folder exists
  const sessionFolderId = await ensureSessionImageFolder(projectId, sessionId);

  // Check if file already exists
  const existingFile = await findChildFile(projectId, sessionFolderId, fileName);

  if (existingFile) {
    // Update existing file content
    console.log(`[AutoFigure FileOps] Updating existing file: ${fileName}`);
    await fileApi.updateFileContent(existingFile.id, content);

    // Refresh file tree
    await useFileTreeStore.getState().refresh();

    return {
      id: existingFile.id,
      name: existingFile.name,
      path: `/${AUTOFIGURE_ROOT}/${IMAGE_FOLDER}/${sessionId}/${existingFile.name}`,
    };
  }

  // File doesn't exist, create new one
  const blob = new Blob([content], { type: "text/plain" });
  const file = new File([blob], fileName, { type: "text/plain" });

  // Upload the file
  const uploaded = await fileApi.uploadFileAuto(
    projectId,
    file,
    sessionFolderId
  );

  // Refresh file tree
  await useFileTreeStore.getState().refresh();

  return {
    id: uploaded.id,
    name: uploaded.name,
    path: uploaded.path || `/${AUTOFIGURE_ROOT}/${IMAGE_FOLDER}/${sessionId}/${uploaded.name}`,
  };
}

/**
 * Save all AutoFigure iteration artifacts (PNG and XML)
 *
 * @param projectId - The current project ID
 * @param sessionId - The AutoFigure session ID
 * @param iteration - The iteration number
 * @param pngBase64 - The base64-encoded PNG image
 * @param xmlContent - The mxGraph XML content
 * @returns Object with saved file paths
 */
export async function saveIterationArtifacts(
  projectId: string,
  sessionId: string,
  iteration: number,
  pngBase64: string | null,
  xmlContent: string | null
): Promise<{ pngPath: string | null; xmlPath: string | null }> {
  console.log(`[AutoFigure FileOps] saveIterationArtifacts called - projectId: ${projectId}, sessionId: ${sessionId}, iteration: ${iteration}`);
  console.log(`[AutoFigure FileOps] pngBase64 length: ${pngBase64?.length || 0}, xmlContent length: ${xmlContent?.length || 0}`);

  const results: { pngPath: string | null; xmlPath: string | null } = {
    pngPath: null,
    xmlPath: null,
  };

  try {
    // Save PNG if available
    if (pngBase64) {
      console.log(`[AutoFigure FileOps] Saving PNG for iteration ${iteration}...`);
      const pngResult = await saveBase64ImageToAutoFigure(
        projectId,
        sessionId,
        pngBase64,
        `iteration_${iteration}.png`
      );
      results.pngPath = pngResult.path;
      console.log(`[AutoFigure FileOps] Saved iteration ${iteration} PNG:`, pngResult.path);
    }

    // Save XML if available
    if (xmlContent) {
      console.log(`[AutoFigure FileOps] Saving XML for iteration ${iteration}...`);
      const xmlResult = await saveXmlToAutoFigure(
        projectId,
        sessionId,
        xmlContent,
        `iteration_${iteration}.xml`
      );
      results.xmlPath = xmlResult.path;
      console.log(`[AutoFigure FileOps] Saved iteration ${iteration} XML:`, xmlResult.path);
    }
  } catch (error) {
    console.error(`[AutoFigure FileOps] Error saving iteration ${iteration} artifacts:`, error);
    throw error; // Re-throw to let caller handle
  }

  return results;
}

/**
 * Save final layout artifacts
 *
 * @param projectId - The current project ID
 * @param sessionId - The AutoFigure session ID
 * @param pngBase64 - The base64-encoded PNG image
 * @param xmlContent - The mxGraph XML content
 * @returns Object with saved file paths
 */
export async function saveFinalArtifacts(
  projectId: string,
  sessionId: string,
  pngBase64: string | null,
  xmlContent: string | null
): Promise<{ pngPath: string | null; xmlPath: string | null }> {
  const results: { pngPath: string | null; xmlPath: string | null } = {
    pngPath: null,
    xmlPath: null,
  };

  try {
    // Save final PNG
    if (pngBase64) {
      const pngResult = await saveBase64ImageToAutoFigure(
        projectId,
        sessionId,
        pngBase64,
        "final.png"
      );
      results.pngPath = pngResult.path;
      console.log("[AutoFigure] Saved final PNG:", pngResult.path);
    }

    // Save final XML
    if (xmlContent) {
      const xmlResult = await saveXmlToAutoFigure(
        projectId,
        sessionId,
        xmlContent,
        "final.xml"
      );
      results.xmlPath = xmlResult.path;
      console.log("[AutoFigure] Saved final XML:", xmlResult.path);
    }
  } catch (error) {
    console.error("[AutoFigure] Error saving final artifacts:", error);
  }

  return results;
}

/**
 * Save enhanced image
 *
 * @param projectId - The current project ID
 * @param sessionId - The AutoFigure session ID
 * @param variant - The variant number
 * @param pngBase64 - The base64-encoded PNG image
 * @returns The saved file path or null on error
 */
export async function saveEnhancedImage(
  projectId: string,
  sessionId: string,
  variant: number,
  pngBase64: string
): Promise<string | null> {
  try {
    const result = await saveBase64ImageToAutoFigure(
      projectId,
      sessionId,
      pngBase64,
      `enhanced_${variant}.png`
    );
    console.log(`[AutoFigure] Saved enhanced image ${variant}:`, result.path);
    return result.path;
  } catch (error) {
    console.error(`[AutoFigure] Error saving enhanced image ${variant}:`, error);
    return null;
  }
}

/**
 * Get the current project ID from the file tree store
 */
export function getCurrentProjectId(): string | null {
  return useFileTreeStore.getState().projectId;
}

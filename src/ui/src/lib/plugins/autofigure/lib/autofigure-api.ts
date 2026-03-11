/**
 * AutoFigure API Client
 *
 * API client for communicating with the AutoFigure backend service.
 *
 * @module lib/plugins/autofigure/lib/autofigure-api
 */

import type {
  ContentType,
  SessionStatus,
  EvaluationResult,
} from "./autofigure-types";

// ============================================================
// Types
// ============================================================

export interface CreateSessionRequest {
  input_content: string;
  input_type: "text" | "pdf";
  project_id?: string;
  source_file_name?: string;
  config: {
    contentType: ContentType;
    sessionName?: string;
    sourceFileName?: string;
    maxIterations?: number;
    qualityThreshold?: number;
    minImprovement?: number;
    humanInLoop?: boolean;
    llmProvider: string;
    apiKey: string;
    baseUrl?: string;
    model: string;
    svgWidth?: number;
    svgHeight?: number;
    enableMethodologyExtraction?: boolean;
    methodologyLlmProvider?: string;
    methodologyLlmApiKey?: string;
    methodologyLlmModel?: string;
  };
}

export interface CreateSessionResponse {
  session_id: string;
  status: string;
  message: string;
}

export interface StartGenerationResponse {
  session_id: string;
  status: SessionStatus;
  iteration: number;
  xml: string;
  png_base64: string | null;
  evaluation: EvaluationResult | null;
}

export interface ContinueIterationRequest {
  current_xml: string;
  human_feedback?: string;
  human_score?: number;
}

export interface ContinueIterationResponse {
  session_id: string;
  status: SessionStatus;
  iteration: number;
  xml: string;
  png_base64: string | null;
  evaluation: EvaluationResult | null;
  message?: string;
}

export interface FinalizeRequest {
  final_xml: string;
}

export interface FinalizeResponse {
  session_id: string;
  status: string;
  png_base64: string | null;
  message: string;
}

// ============================================================
// API Client
// ============================================================

const AUTOFIGURE_API_BASE = "/api/v1/autofigure";

async function fetchAutofigure<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${AUTOFIGURE_API_BASE}${endpoint}`;

  // Get auth token from localStorage
  const token =
    typeof window !== "undefined"
      ? localStorage.getItem("ds_access_token")
      : null;

  const response = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      errorData.error || `AutoFigure API error: ${response.status}`
    );
  }

  return response.json();
}

/**
 * Check if AutoFigure backend is available
 */
export async function checkHealth(): Promise<{
  status: string;
  autofigure_available: boolean;
  enhancement_available: boolean;
}> {
  return fetchAutofigure("/health");
}

/**
 * Create a new AutoFigure session
 */
export async function createSession(
  request: CreateSessionRequest
): Promise<CreateSessionResponse> {
  return fetchAutofigure("/session/create", {
    method: "POST",
    body: JSON.stringify(request),
  });
}

/**
 * Start figure generation for a session
 */
export async function startGeneration(
  sessionId: string
): Promise<StartGenerationResponse> {
  return fetchAutofigure(`/session/${sessionId}/start`, {
    method: "POST",
  });
}

/**
 * Continue to next iteration with optional feedback
 */
export async function continueIteration(
  sessionId: string,
  request: ContinueIterationRequest
): Promise<ContinueIterationResponse> {
  return fetchAutofigure(`/session/${sessionId}/continue`, {
    method: "POST",
    body: JSON.stringify(request),
  });
}

/**
 * Finalize the layout
 */
export async function finalizeLayout(
  sessionId: string,
  request: FinalizeRequest
): Promise<FinalizeResponse> {
  return fetchAutofigure(`/session/${sessionId}/finalize`, {
    method: "POST",
    body: JSON.stringify(request),
  });
}

/**
 * Get session data
 */
export async function getSession(sessionId: string): Promise<{
  session_id: string;
  status: SessionStatus;
  current_iteration: number;
  iterations: Array<{
    iteration: number;
    xml: string;
    png_base64: string | null;
    evaluation: EvaluationResult | null;
  }>;
  final_xml: string | null;
  enhanced_images: Array<{
    variant: number;
    status: string;
    pngBase64: string | null;
  }>;
}> {
  return fetchAutofigure(`/session/${sessionId}`);
}

/**
 * Delete a session
 */
export async function deleteSession(
  sessionId: string
): Promise<{ message: string }> {
  return fetchAutofigure(`/session/${sessionId}`, {
    method: "DELETE",
  });
}

/**
 * Combined function to create session and start generation
 */
export async function generateFigure(
  inputContent: string,
  inputType: "text" | "pdf",
  config: CreateSessionRequest["config"]
): Promise<{
  sessionId: string;
  xml: string;
  pngBase64: string | null;
  evaluation: EvaluationResult | null;
}> {
  // Step 1: Create session
  const createResponse = await createSession({
    input_content: inputContent,
    input_type: inputType,
    config,
  });

  const sessionId = createResponse.session_id;

  // Step 2: Start generation
  const startResponse = await startGeneration(sessionId);

  return {
    sessionId,
    xml: startResponse.xml,
    pngBase64: startResponse.png_base64,
    evaluation: startResponse.evaluation,
  };
}

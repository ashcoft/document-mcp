// ============================================================
// API Service — wraps fetch() with error handling
// ============================================================

import type {
  UploadResponse,
  StatusResponse,
  SearchRequest,
  SearchResponse,
  AskRequest,
  AskResponse,
  DocumentListResponse,
  DocumentResponse,
  SystemMetricsResponse,
  AgentActionsListResponse,
  AgentActionStatsResponse,
  LowConfidenceRegionResponse,
  ReviewStatsResponse,
  ValidationResponse,
  DocumentChunksResponse,
} from '../types';

const API_BASE = '/api';

/**
 * Wraps fetch() to convert network-level failures (backend unreachable,
 * DNS errors, etc.) into a clear, user-friendly error message instead of
 * the raw browser "NetworkError when attempting to fetch resource".
 */
async function apiFetch(input: string, init?: RequestInit): Promise<Response> {
  try {
    const response = await fetch(input, init);
    return response;
  } catch (err) {
    if (err instanceof TypeError) {
      throw new Error(
        'Cannot connect to the server. Please ensure the backend is running (http://localhost:8000).'
      );
    }
    throw err;
  }
}

/**
 * Safely parses an error response body as JSON, falling back to raw text.
 */
async function parseErrorResponse(response: Response): Promise<string> {
  if ([502, 503, 504].includes(response.status)) {
    return (
      'Cannot connect to the backend server. ' +
      'Please ensure the backend is running (http://localhost:8000).'
    );
  }

  const text = await response.text();
  try {
    const error = JSON.parse(text);
    return error.detail || error.message || `${response.status} ${response.statusText}`;
  } catch {
    return text || `${response.status} ${response.statusText}`;
  }
}

// ============================================================
// Upload endpoints
// ============================================================

export async function uploadDocument(file: File, discipline?: string): Promise<UploadResponse> {
  const formData = new FormData();
  formData.append('file', file);
  if (discipline) {
    formData.append('discipline', discipline);
  }

  const response = await apiFetch(`${API_BASE}/upload/`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    throw new Error(await parseErrorResponse(response));
  }

  const text = await response.text();
  if (!text) {
    throw new Error('Empty response from server');
  }

  try {
    return JSON.parse(text);
  } catch {
    throw new Error('Invalid JSON response from server');
  }
}

export async function getUploadStatus(jobId: string): Promise<StatusResponse> {
  const response = await apiFetch(`${API_BASE}/upload/status/${encodeURIComponent(jobId)}`);

  if (!response.ok) {
    throw new Error(await parseErrorResponse(response));
  }

  return response.json();
}

// ============================================================
// Search & Q&A endpoints
// ============================================================

export async function searchDocuments(request: SearchRequest): Promise<SearchResponse> {
  const response = await apiFetch(`${API_BASE}/search`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    throw new Error(await parseErrorResponse(response));
  }

  return response.json();
}

export async function askQuestion(request: AskRequest): Promise<AskResponse> {
  const response = await apiFetch(`${API_BASE}/ask`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    throw new Error(await parseErrorResponse(response));
  }

  return response.json();
}

// ============================================================
// Document endpoints
// ============================================================

export async function getDocuments(
  page = 1,
  pageSize = 20,
  filters?: { discipline?: string; status?: string }
): Promise<DocumentListResponse> {
  let url = `${API_BASE}/documents?page=${page}&page_size=${pageSize}`;
  if (filters?.discipline) {
    url += `&discipline=${encodeURIComponent(filters.discipline)}`;
  }
  if (filters?.status) {
    url += `&status=${encodeURIComponent(filters.status)}`;
  }

  const response = await apiFetch(url);

  if (!response.ok) {
    throw new Error(await parseErrorResponse(response));
  }

  return response.json();
}

export async function getDocument(id: number): Promise<DocumentResponse> {
  const response = await apiFetch(`${API_BASE}/documents/${id}`);

  if (!response.ok) {
    throw new Error(await parseErrorResponse(response));
  }

  return response.json();
}

// ============================================================
// Document chunks endpoint (for preview)
// ============================================================

export async function getDocumentChunks(
  id: number
): Promise<DocumentChunksResponse> {
  const response = await apiFetch(`${API_BASE}/documents/${id}/chunks`);

  if (!response.ok) {
    throw new Error(await parseErrorResponse(response));
  }

  return response.json();
}

// ============================================================
// Admin endpoints
// ============================================================

export async function getSystemMetrics(): Promise<SystemMetricsResponse> {
  const response = await apiFetch(`${API_BASE}/admin/metrics`);

  if (!response.ok) {
    throw new Error(await parseErrorResponse(response));
  }

  return response.json();
}

export async function getAgentActions(params?: {
  limit?: number;
  offset?: number;
  action_type?: string;
  document_id?: number;
  job_id?: string;
  success?: boolean;
}): Promise<AgentActionsListResponse> {
  const paramsArr: string[] = [];
  if (params?.limit !== undefined) paramsArr.push(`limit=${params.limit}`);
  if (params?.offset !== undefined) paramsArr.push(`offset=${params.offset}`);
  if (params?.action_type) paramsArr.push(`action_type=${encodeURIComponent(params.action_type)}`);
  if (params?.document_id !== undefined) paramsArr.push(`document_id=${params.document_id}`);
  if (params?.job_id) paramsArr.push(`job_id=${encodeURIComponent(params.job_id)}`);
  if (params?.success !== undefined) paramsArr.push(`success=${params.success}`);

  const query = paramsArr.length > 0 ? `?${paramsArr.join('&')}` : '';
  const response = await apiFetch(`${API_BASE}/admin/actions${query}`);

  if (!response.ok) {
    throw new Error(await parseErrorResponse(response));
  }

  return response.json();
}

export async function getAgentActionStats(hours = 24): Promise<AgentActionStatsResponse> {
  const response = await apiFetch(`${API_BASE}/admin/actions/stats?hours=${hours}`);

  if (!response.ok) {
    throw new Error(await parseErrorResponse(response));
  }

  return response.json();
}

// ============================================================
// Review endpoints
// ============================================================

export async function getFlaggedRegions(
  documentId?: number,
  reviewed = false
): Promise<LowConfidenceRegionResponse[]> {
  let url = `${API_BASE}/review/flagged?reviewed=${reviewed}`;
  if (documentId !== undefined) {
    url += `&document_id=${documentId}`;
  }

  const response = await apiFetch(url);

  if (!response.ok) {
    throw new Error(await parseErrorResponse(response));
  }

  return response.json();
}

export async function getReviewStats(): Promise<ReviewStatsResponse> {
  const response = await apiFetch(`${API_BASE}/review/stats/summary`);

  if (!response.ok) {
    throw new Error(await parseErrorResponse(response));
  }

  return response.json();
}

// ============================================================
// Validation endpoints
// ============================================================

export async function validateDocument(documentId: number): Promise<ValidationResponse> {
  const response = await apiFetch(`${API_BASE}/validation/${documentId}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  });

  if (!response.ok) {
    throw new Error(await parseErrorResponse(response));
  }

  return response.json();
}
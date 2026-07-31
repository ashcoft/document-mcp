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
    // fetch() throws a TypeError on network-level failures
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
 *
 * Gateway/proxy errors (502, 503, 504) typically have an empty body and an
 * unhelpful statusText (e.g. "OK"). When the Vite dev-proxy cannot reach the
 * backend, it responds with one of these codes, so we translate them into a
 * clear, actionable message instead of the raw "502 OK".
 */
async function parseErrorResponse(response: Response): Promise<string> {
  // Gateway/proxy errors – the backend is unreachable or crashed.
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

export async function uploadDocument(file: File, discipline?: string): Promise<unknown> {
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

export async function getUploadStatus(jobId: string): Promise<unknown> {
  const response = await apiFetch(`${API_BASE}/upload/status/${encodeURIComponent(jobId)}`);

  if (!response.ok) {
    throw new Error(await parseErrorResponse(response));
  }

  return response.json();
}

export async function searchDocuments(request: {
  query: string;
  limit?: number;
  discipline?: string;
  document_ids?: number[];
}): Promise<unknown> {
  const response = await apiFetch(`${API_BASE}/search`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    throw new Error(await parseErrorResponse(response));
  }

  return response.json();
}

export async function askQuestion(request: {
  query: string;
  discipline?: string;
  document_ids?: number[];
}): Promise<unknown> {
  const response = await apiFetch(`${API_BASE}/ask`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    throw new Error(await parseErrorResponse(response));
  }

  return response.json();
}

export async function getDocuments(page = 1, pageSize = 20): Promise<unknown> {
  const response = await apiFetch(`${API_BASE}/documents?page=${page}&page_size=${pageSize}`);

  if (!response.ok) {
    throw new Error(await parseErrorResponse(response));
  }

  return response.json();
}

export async function getDocument(id: number): Promise<unknown> {
  const response = await apiFetch(`${API_BASE}/documents/${id}`);

  if (!response.ok) {
    throw new Error(await parseErrorResponse(response));
  }

  return response.json();
}

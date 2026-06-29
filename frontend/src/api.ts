const API_BASE = 'http://localhost:8000/api';

export async function uploadDocument(file: File, discipline?: string): Promise<unknown> {
  const formData = new FormData();
  formData.append('file', file);
  if (discipline) {
    formData.append('discipline', discipline);
  }

  const response = await fetch(`${API_BASE}/upload/`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const text = await response.text();
    try {
      const error = JSON.parse(text);
      throw new Error(error.detail || error.message || 'Upload failed');
    } catch {
      throw new Error(`Upload failed: ${response.status} ${response.statusText}`);
    }
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
  const response = await fetch(`${API_BASE}/upload/status/${encodeURIComponent(jobId)}`);

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to get status');
  }

  return response.json();
}

export async function searchDocuments(request: {
  query: string;
  limit?: number;
  discipline?: string;
  document_ids?: number[];
}): Promise<unknown> {
  const response = await fetch(`${API_BASE}/search`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Search failed');
  }

  return response.json();
}

export async function askQuestion(request: {
  query: string;
  discipline?: string;
  document_ids?: number[];
}): Promise<unknown> {
  const response = await fetch(`${API_BASE}/ask`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Question failed');
  }

  return response.json();
}

export async function getDocuments(page = 1, pageSize = 20): Promise<unknown> {
  const response = await fetch(`${API_BASE}/documents?page=${page}&page_size=${pageSize}`);

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to fetch documents');
  }

  return response.json();
}

export async function getDocument(id: number): Promise<unknown> {
  const response = await fetch(`${API_BASE}/documents/${id}`);

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to fetch document');
  }

  return response.json();
}

// CAD Viewer API functions
export async function getCADViewerStatus(jobId: string): Promise<unknown> {
  const response = await fetch(`${API_BASE}/viewer/status/${encodeURIComponent(jobId)}`);

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to get CAD viewer status');
  }

  return response.json();
}

export async function getCADPreview(jobId: string, page = 1, dpi = 150): Promise<Blob> {
  const response = await fetch(
    `${API_BASE}/viewer/preview/${encodeURIComponent(jobId)}?page=${page}&dpi=${dpi}`
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to get CAD preview');
  }

  return response.blob();
}

export async function getCADAttributes(jobId: string): Promise<unknown> {
  const response = await fetch(`${API_BASE}/viewer/attributes/${encodeURIComponent(jobId)}`);

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to get CAD attributes');
  }

  return response.json();
}

export async function getCADLayers(jobId: string): Promise<unknown> {
  const response = await fetch(`${API_BASE}/viewer/layers/${encodeURIComponent(jobId)}`);

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to get CAD layers');
  }

  return response.json();
}
// ============================================================
// API Types — mirrors backend Pydantic schemas
// ============================================================

export interface UploadResponse {
  job_id: string;
  document_id: number;
  filename: string;
  status: string;
  message: string;
}

export interface StatusResponse {
  job_id: string;
  document_id: number;
  status: string; // Checking, Approved, Rejected
  progress: number; // 0-100
  message?: string | null;
  rejection_note?: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
}

export interface SearchRequest {
  query: string;
  limit?: number;
  discipline?: string;
  document_ids?: number[];
}

export interface SearchResult {
  chunk_id: number;
  content: string;
  document_id: number;
  document_number?: string;
  title?: string;
  discipline?: string;
  score: number;
  search_type: string;
}

export interface SearchResponse {
  query: string;
  results: SearchResult[];
  total: number;
}

export interface AskRequest {
  query: string;
  discipline?: string;
  document_ids?: number[];
}

export interface Citation {
  document_number: string;
  title?: string;
  page_or_sheet: string;
}

export interface AskResponse {
  answer: string;
  confidence: string; // High, Medium, Low
  citations: Citation[];
  query: string;
  context_chunks_used: number;
}

export interface DocumentResponse {
  id: number;
  document_number?: string;
  title?: string;
  revision?: string;
  issue_status?: string;
  contract_number?: string;
  discipline?: string;
  page_count?: number;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface DocumentListResponse {
  documents: DocumentResponse[];
  total: number;
  page: number;
  page_size: number;
}

// ============================================================
// Admin / Metrics Types
// ============================================================

export interface DocumentMetrics {
  total: number;
  by_status: Record<string, number>;
}

export interface ReviewQueueMetrics {
  unreviewed_regions: number;
}

export interface ActivityMetrics {
  recent_agent_actions: number;
  recent_qa_queries: number;
  total_submissions: number;
}

export interface SystemMetricsResponse {
  documents: DocumentMetrics;
  review_queue: ReviewQueueMetrics;
  activity: ActivityMetrics;
  timestamp: string;
}

export interface AgentActionResponse {
  id: number;
  document_id: number | null;
  job_id: string | null;
  action_type: string;
  decision: string;
  reasoning: string | null;
  context: Record<string, unknown> | null;
  model_version: string | null;
  confidence: number | null;
  success: boolean;
  created_at: string;
}

export interface AgentActionsListResponse {
  actions: AgentActionResponse[];
  total: number;
  limit: number;
  offset: number;
}

export interface AgentActionStatsResponse {
  period_hours: number;
  total_actions: number;
  successful_actions: number;
  success_rate: number;
  by_action_type: Record<string, number>;
  by_decision: Record<string, number>;
  average_confidence: number | null;
  cutoff: string;
}

// ============================================================
// Review Types
// ============================================================

export interface LowConfidenceRegionResponse {
  id: number;
  document_id: number;
  page: number;
  bbox: Record<string, unknown>;
  text: string | null;
  confidence: number;
  reviewed: boolean;
  reviewed_by: string | null;
  reviewed_at: string | null;
  created_at: string;
}

export interface ReviewStatsResponse {
  total_flagged: number;
  unreviewed: number;
  reviewed: number;
  average_confidence: number;
  review_progress: number;
}

// ============================================================
// Document Chunk Types (for preview)
// ============================================================

export interface DocumentChunk {
  id: number;
  document_id: number;
  level: string; // parent or child
  content: string;
  token_count?: number;
  page?: number;
}

export interface DocumentChunksResponse {
  document_id: number;
  chunks: DocumentChunk[];
  total: number;
}

// ============================================================
// Validation Types
// ============================================================

export interface ValidationResponse {
  document_id: number;
  passed: boolean;
  rules_evaluated: number;
  rules_failed: number;
  failed_rules: Record<string, unknown>[];
  warnings: Record<string, unknown>[];
  validated_at: string;
}
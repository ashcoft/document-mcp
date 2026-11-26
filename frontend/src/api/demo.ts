// ============================================================
// Demo API — serves canned data so the static GitHub Pages build
// is fully interactive without a backend. Enabled with VITE_DEMO_MODE=true.
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
  AgentActionResponse,
  AgentActionStatsResponse,
  LowConfidenceRegionResponse,
  ReviewStatsResponse,
  ValidationResponse,
  DocumentChunksResponse,
  DocumentChunk,
  SearchResult,
  Citation,
} from '../types';

const LATENCY_MS = 220;
const PIPELINE_MS = 4000;

function delay<T>(value: T, ms = LATENCY_MS): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms));
}

function daysAgo(days: number): string {
  return new Date(Date.now() - days * 86_400_000).toISOString();
}

let jobSequence = 0;

function newId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  jobSequence += 1;
  return `demo-job-${jobSequence}`;
}

// ============================================================
// Seed data
// ============================================================

const documents: DocumentResponse[] = [
  {
    id: 1,
    document_number: 'ELC-SLD-0001',
    title: '132 kV Substation Single Line Diagram',
    revision: 'C',
    issue_status: 'Issued for Construction',
    contract_number: 'EPC-2026-014',
    discipline: 'ELC',
    page_count: 3,
    status: 'Approved',
    created_at: daysAgo(21),
    updated_at: daysAgo(2),
  },
  {
    id: 2,
    document_number: 'ELC-CBL-0042',
    title: 'Power Cable Schedule — Unit Substation 2',
    revision: 'B',
    issue_status: 'Issued for Review',
    contract_number: 'EPC-2026-014',
    discipline: 'ELC',
    page_count: 8,
    status: 'Approved',
    created_at: daysAgo(16),
    updated_at: daysAgo(4),
  },
  {
    id: 3,
    document_number: 'MEC-PID-0117',
    title: 'Cooling Water Piping and Instrumentation Diagram',
    revision: 'D',
    issue_status: 'Issued for Construction',
    contract_number: 'EPC-2026-014',
    discipline: 'MEC',
    page_count: 5,
    status: 'Approved',
    created_at: daysAgo(34),
    updated_at: daysAgo(1),
  },
  {
    id: 4,
    document_number: 'MEC-DSL-0009',
    title: 'Pump Datasheet — Main Cooling Water Pump',
    revision: 'A',
    issue_status: 'Issued for Review',
    contract_number: 'EPC-2026-014',
    discipline: 'MEC',
    page_count: 2,
    status: 'Checking',
    created_at: daysAgo(2),
    updated_at: daysAgo(0),
  },
  {
    id: 5,
    document_number: 'INS-LST-0210',
    title: 'Instrument Index — Boiler Area',
    revision: 'B',
    issue_status: 'Issued for Review',
    contract_number: 'EPC-2026-014',
    discipline: 'INS',
    page_count: 12,
    status: 'Rejected',
    created_at: daysAgo(9),
    updated_at: daysAgo(3),
  },
  {
    id: 6,
    document_number: 'SIM-HAZ-0033',
    title: 'HAZOP Study Report — Feed Section',
    revision: '0',
    issue_status: 'Issued for Information',
    contract_number: 'EPC-2026-014',
    discipline: 'SIM',
    page_count: 24,
    status: 'Approved',
    created_at: daysAgo(48),
    updated_at: daysAgo(6),
  },
];

const chunksByDocument: Record<number, DocumentChunk[]> = {
  1: [
    {
      id: 101,
      document_id: 1,
      level: 'parent',
      content:
        'The 132 kV substation is configured as a double busbar arrangement with two incoming feeders, ' +
        'two 63 MVA transformers, and eight outgoing 11 kV feeders. Busbar protection is provided by a ' +
        'numerical differential relay scheme.',
      token_count: 62,
      page: 1,
    },
    {
      id: 102,
      document_id: 1,
      level: 'child',
      content:
        'Transformer T1 and T2 ratings: 63 MVA, 132/11 kV, ONAN/ONAF, impedance 12.5 percent, ' +
        'vector group YNd11.',
      token_count: 28,
      page: 1,
    },
    {
      id: 103,
      document_id: 1,
      level: 'child',
      content:
        'Earthing design: 132 kV system solidly earthed; 11 kV system earthed through a 400 A ' +
        'neutral earthing resistor.',
      token_count: 26,
      page: 2,
    },
  ],
  2: [
    {
      id: 201,
      document_id: 2,
      level: 'parent',
      content:
        'Power cables shall be XLPE insulated, 6.35/11 kV grade, armoured, with stranded copper ' +
        'conductors. Cable sizes are selected for a 2 percent voltage drop limit at full load.',
      token_count: 58,
      page: 1,
    },
    {
      id: 202,
      document_id: 2,
      level: 'child',
      content:
        'Cable tag CBL-0117: 3C x 185 mm2 Cu XLPE, route Unit Substation 2 to MCC-2, length 145 m.',
      token_count: 24,
      page: 3,
    },
  ],
  3: [
    {
      id: 301,
      document_id: 3,
      level: 'parent',
      content:
        'Cooling water is supplied by two 100 percent pumps operating duty/standby. Each pump is ' +
        'rated 450 m3/h at 65 m head. A minimum flow bypass protects the pumps below 30 percent flow.',
      token_count: 55,
      page: 1,
    },
    {
      id: 302,
      document_id: 3,
      level: 'child',
      content:
        'Pump P-101A/B start permissive: cooling water header pressure above 2.5 barg and ' +
        'suction valve open.',
      token_count: 22,
      page: 2,
    },
  ],
  4: [
    {
      id: 401,
      document_id: 4,
      level: 'parent',
      content:
        'Main cooling water pump datasheet: horizontal centrifugal, 450 m3/h, 65 m head, ' +
        'motor 132 kW, 415 V, 50 Hz, efficiency 82 percent at duty point.',
      token_count: 44,
      page: 1,
    },
  ],
  5: [
    {
      id: 501,
      document_id: 5,
      level: 'parent',
      content:
        'Instrument index lists 412 instruments for the boiler area including transmitters, ' +
        'switches, and control valves with tag numbers, service descriptions, and line references.',
      token_count: 48,
      page: 1,
    },
  ],
  6: [
    {
      id: 601,
      document_id: 6,
      level: 'parent',
      content:
        'HAZOP of the feed section identified 18 deviations. Two high-risk findings relate to ' +
        'reverse flow through the feed preheat exchanger during a control valve failure.',
      token_count: 50,
      page: 4,
    },
  ],
};

const regions: LowConfidenceRegionResponse[] = [
  {
    id: 901,
    document_id: 5,
    page: 4,
    bbox: { x: 118, y: 402, width: 210, height: 36 },
    text: 'FT-2104B range 0-250 m3/h',
    confidence: 0.61,
    reviewed: false,
    reviewed_by: null,
    reviewed_at: null,
    created_at: daysAgo(3),
  },
  {
    id: 902,
    document_id: 4,
    page: 1,
    bbox: { x: 84, y: 512, width: 268, height: 30 },
    text: 'NPSH required 3.8 m',
    confidence: 0.68,
    reviewed: false,
    reviewed_by: null,
    reviewed_at: null,
    created_at: daysAgo(2),
  },
  {
    id: 903,
    document_id: 2,
    page: 5,
    bbox: { x: 240, y: 188, width: 190, height: 28 },
    text: 'CBL-0117 derating factor 0.87',
    confidence: 0.72,
    reviewed: true,
    reviewed_by: 'demo.controller',
    reviewed_at: daysAgo(1),
    created_at: daysAgo(6),
  },
];

const agentActions: AgentActionResponse[] = [
  {
    id: 7001,
    document_id: 1,
    job_id: 'demo-job-0001',
    action_type: 'ocr_extraction',
    decision: 'accepted',
    reasoning: '300 DPI pass cleared the 0.75 confidence gate for all drawing regions.',
    context: { pages: 3, mean_confidence: 0.93 },
    model_version: 'paddleocr-3.7',
    confidence: 0.93,
    success: true,
    created_at: daysAgo(21),
  },
  {
    id: 7002,
    document_id: 1,
    job_id: 'demo-job-0001',
    action_type: 'llm_parse',
    decision: 'accepted',
    reasoning: 'Deterministic and LLM extractions agreed on document number and revision.',
    context: { fields_merged: 9 },
    model_version: 'llama3.1:8b-instruct-q4_K_M',
    confidence: 0.88,
    success: true,
    created_at: daysAgo(21),
  },
  {
    id: 7003,
    document_id: 5,
    job_id: 'demo-job-0005',
    action_type: 'validation',
    decision: 'rejected',
    reasoning: 'Revision block missing the contract number required by rule VAL-004.',
    context: { rule: 'VAL-004', severity: 'major' },
    model_version: 'rules-v1',
    confidence: 0.95,
    success: true,
    created_at: daysAgo(9),
  },
  {
    id: 7004,
    document_id: 4,
    job_id: 'demo-job-0004',
    action_type: 'ocr_extraction',
    decision: 'flagged',
    reasoning: 'Two regions below the confidence threshold routed to the review queue.',
    context: { flagged_regions: 1 },
    model_version: 'paddleocr-3.7',
    confidence: 0.68,
    success: true,
    created_at: daysAgo(2),
  },
  {
    id: 7005,
    document_id: 3,
    job_id: 'demo-job-0003',
    action_type: 'qa_answer',
    decision: 'accepted',
    reasoning: 'Answered a cooling water question from two approved passages with citations.',
    context: { citations: 2 },
    model_version: 'llama3.1:8b-instruct-q4_K_M',
    confidence: 0.86,
    success: true,
    created_at: new Date(Date.now() - 2 * 3_600_000).toISOString(),
  },
];

function actionsSince(hours: number): AgentActionResponse[] {
  const cutoff = Date.now() - hours * 3_600_000;
  return agentActions.filter((action) => new Date(action.created_at).getTime() >= cutoff);
}

interface UploadJob {
  documentId: number;
  filename: string;
  discipline?: string;
  startedAt: number;
  rejected: boolean;
}

const jobs = new Map<string, UploadJob>();
let nextDocumentId = 100;
let nextChunkId = 1000;

function findDocument(id: number): DocumentResponse {
  const doc = documents.find((d) => d.id === id);
  if (!doc) {
    throw new Error(`Document ${id} not found`);
  }
  return doc;
}

function citationFor(doc: DocumentResponse, page: number | undefined): Citation {
  return {
    document_number: doc.document_number ?? `DOC-${doc.id}`,
    title: doc.title,
    page_or_sheet: page ? `Page ${page}` : 'Page 1',
  };
}

const STOPWORDS = new Set([
  'a', 'an', 'and', 'are', 'as', 'at', 'be', 'been', 'being', 'but', 'by', 'can', 'could',
  'did', 'do', 'does', 'for', 'from', 'had', 'has', 'have', 'how', 'if', 'in', 'into',
  'is', 'it', 'its', 'may', 'might', 'no', 'not', 'of', 'on', 'or', 'per', 'should', 'so',
  'that', 'the', 'their', 'there', 'these', 'they', 'this', 'those', 'to', 'up', 'us', 'was',
  'we', 'were', 'what', 'when', 'where', 'which', 'why', 'will', 'with', 'would', 'you', 'your',
]);

function isDigit(char: string): boolean {
  return char >= '0' && char <= '9';
}

function trimDots(term: string): string {
  let start = 0;
  let end = term.length;
  while (start < end && term[start] === '.') start += 1;
  while (end > start && term[end - 1] === '.') end -= 1;
  return term.slice(start, end);
}

function normalizeTerm(term: string): string {
  // Keep dots so 12.5 and 6.35 stay whole, give .75 a leading zero, and trim
  // sentence-ending dots so YNd11. and YNd11 compare equal.
  const value = term.startsWith('.') && term.length > 1 && isDigit(term[1]) ? `0${term}` : term;
  return trimDots(value);
}

function splitTerms(text: string): string[] {
  return text
    .toLowerCase()
    .split(/[^a-z0-9.]+/)
    .map(normalizeTerm)
    .filter((term) => term.length > 0);
}

function tokenize(query: string): string[] {
  const terms = splitTerms(query).filter((term) => term.length >= 2);
  const meaningful = terms.filter((term) => !STOPWORDS.has(term));
  // A query made only of common words still searches those words.
  return meaningful.length > 0 ? meaningful : terms;
}

function scoreChunk(content: string, terms: string[]): number {
  if (terms.length === 0) return 0;
  const haystack = content.toLowerCase();
  const contentTokens = new Set(splitTerms(content));
  const hits = terms.filter((term) => {
    // Values, identifiers, and short terms must match a whole token: 2.5 must
    // not match 12.5, YNd11 must not match XYNd11, and "in" must not match
    // "single". Longer words keep substring matching for plurals and suffixes.
    if (/\d/.test(term) || term.length <= 3) return contentTokens.has(term);
    return haystack.includes(term);
  }).length;
  return hits / terms.length;
}

// ============================================================
// Upload
// ============================================================

export async function uploadDocument(
  file: File,
  discipline?: string
): Promise<UploadResponse> {
  const jobId = newId();
  const documentId = nextDocumentId++;
  const rejected = /reject/i.test(file.name);
  const title = file.name.replace(/\.[^.]+$/, '').replace(/[_-]+/g, ' ');

  documents.unshift({
    id: documentId,
    document_number: undefined,
    title,
    revision: 'A',
    issue_status: 'Issued for Review',
    discipline,
    page_count: 1,
    status: 'Checking',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  });

  jobs.set(jobId, {
    documentId,
    filename: file.name,
    discipline,
    startedAt: Date.now(),
    rejected,
  });

  // Finish on a timer so the job completes even if the upload page stops polling.
  setTimeout(() => finalizeJob(jobId), PIPELINE_MS);

  return delay({
    job_id: jobId,
    document_id: documentId,
    filename: file.name,
    status: 'Checking',
    message: 'Document uploaded to the demo pipeline.',
  });
}

interface Stage {
  status: string;
  progress: number;
}

function stageFor(elapsed: number, rejected: boolean): Stage {
  if (elapsed >= PIPELINE_MS) {
    return { status: rejected ? 'Rejected' : 'Approved', progress: 100 };
  }
  if (elapsed >= 3000) return { status: 'Checking', progress: 90 };
  if (elapsed >= 2000) return { status: 'Checking', progress: 70 };
  if (elapsed >= 1000) return { status: 'Checking', progress: 45 };
  return { status: 'Checking', progress: 15 };
}

function completeJob(job: UploadJob, doc: DocumentResponse, status: string): void {
  if (doc.status === status) return;

  doc.status = status;
  doc.updated_at = new Date().toISOString();

  const prefix = job.discipline ?? 'GEN';
  doc.document_number = `${prefix}-NEW-${String(doc.id).padStart(4, '0')}`;
  if (status !== 'Approved') return;

  doc.revision = '0';
  doc.issue_status = 'Issued for Review';
  chunksByDocument[doc.id] = [
    {
      id: nextChunkId++,
      document_id: doc.id,
      level: 'parent',
      content: `Extracted text from ${job.filename}: title block parsed, revision 0 identified, and the body content chunked for retrieval.`,
      token_count: 28,
      page: 1,
    },
  ];
}

function statusMessage(progress: number, rejected: boolean): string {
  if (progress < 100) return 'Processing document…';
  return rejected ? 'Validation failed: missing contract number.' : 'Document validated and approved.';
}

function rejectionNote(doc: DocumentResponse): Record<string, unknown> {
  return {
    document_number: doc.document_number,
    rejection_date: new Date().toISOString(),
    comments: [
      {
        comment: 'Contract number is missing from the title block.',
        response: 'To be corrected and resubmitted as revision B.',
      },
    ],
  };
}

function finalizeJob(jobId: string): void {
  const job = jobs.get(jobId);
  if (!job) return;
  completeJob(job, findDocument(job.documentId), job.rejected ? 'Rejected' : 'Approved');
}

export async function getUploadStatus(jobId: string): Promise<StatusResponse> {
  const job = jobs.get(jobId);
  if (!job) {
    throw new Error(`Job not found: ${jobId}`);
  }

  const doc = findDocument(job.documentId);
  const elapsed = Date.now() - job.startedAt;
  const finished = elapsed >= PIPELINE_MS;
  if (finished) {
    finalizeJob(jobId);
  }
  const stage = stageFor(elapsed, job.rejected);

  return delay({
    job_id: jobId,
    document_id: doc.id,
    status: stage.status,
    progress: stage.progress,
    message: statusMessage(stage.progress, job.rejected),
    rejection_note: finished && job.rejected ? rejectionNote(doc) : null,
    created_at: doc.created_at,
    updated_at: doc.updated_at,
  });
}

// ============================================================
// Search and Q&A
// ============================================================

function matchesFilters(doc: DocumentResponse, request: SearchRequest): boolean {
  if (doc.status !== 'Approved') return false;
  if (request.discipline && doc.discipline !== request.discipline) return false;
  if (request.document_ids?.length && !request.document_ids.includes(doc.id)) return false;
  return true;
}

function resultsForDocument(doc: DocumentResponse, terms: string[]): SearchResult[] {
  const results: SearchResult[] = [];
  for (const chunk of chunksByDocument[doc.id] ?? []) {
    const score = scoreChunk(chunk.content, terms);
    if (score <= 0) continue;
    results.push({
      chunk_id: chunk.id,
      content: chunk.content,
      document_id: doc.id,
      document_number: doc.document_number,
      title: doc.title,
      discipline: doc.discipline,
      score: Math.min(0.97, 0.45 + score * 0.5),
      search_type: score > 0.6 ? 'hybrid' : 'vector',
    });
  }
  return results;
}

export async function searchDocuments(request: SearchRequest): Promise<SearchResponse> {
  const terms = tokenize(request.query);
  const limit = request.limit ?? 10;

  const results = documents
    .filter((doc) => matchesFilters(doc, request))
    .flatMap((doc) => resultsForDocument(doc, terms));
  results.sort((a, b) => b.score - a.score);

  return delay({
    query: request.query,
    results: results.slice(0, limit),
    total: results.length,
  });
}

function citationsFromResults(results: SearchResult[]): Citation[] {
  const citations: Citation[] = [];
  for (const result of results) {
    const doc = findDocument(result.document_id);
    const chunk = (chunksByDocument[doc.id] ?? []).find((c) => c.id === result.chunk_id);
    const citation = citationFor(doc, chunk?.page);
    const seen = citations.some(
      (c) => c.document_number === citation.document_number && c.page_or_sheet === citation.page_or_sheet
    );
    if (!seen) {
      citations.push(citation);
    }
  }
  return citations;
}

function emptyAnswer(query: string): AskResponse {
  return {
    answer:
      'No approved document in the demo set covers this question. Try asking about transformer ' +
      'ratings, cable sizing, cooling water pumps, or HAZOP findings.',
    confidence: 'Low',
    citations: [],
    query,
    context_chunks_used: 0,
  };
}

export async function askQuestion(request: AskRequest): Promise<AskResponse> {
  const search = await searchDocuments({
    query: request.query,
    limit: 5,
    discipline: request.discipline,
    document_ids: request.document_ids,
  });

  if (search.results.length === 0) {
    return delay(emptyAnswer(request.query));
  }

  const top = search.results.slice(0, 3);
  const confidence = search.results[0].score >= 0.8 ? 'High' : 'Medium';
  const passages = top.map((r) => r.content).join(' ');

  return delay({
    answer: `Based on ${top.length} retrieved passage${top.length > 1 ? 's' : ''}: ${passages}`,
    confidence,
    citations: citationsFromResults(top),
    query: request.query,
    context_chunks_used: top.length,
  });
}

// ============================================================
// Documents
// ============================================================

export async function getDocuments(
  page = 1,
  pageSize = 20,
  filters?: { discipline?: string; status?: string }
): Promise<DocumentListResponse> {
  let filtered = documents;
  if (filters?.discipline) {
    filtered = filtered.filter((d) => d.discipline === filters.discipline);
  }
  if (filters?.status) {
    filtered = filtered.filter((d) => d.status === filters.status);
  }

  const start = (page - 1) * pageSize;
  return delay({
    documents: filtered.slice(start, start + pageSize).map((doc) => ({ ...doc })),
    total: filtered.length,
    page,
    page_size: pageSize,
  });
}

export async function getDocument(id: number): Promise<DocumentResponse> {
  return delay({ ...findDocument(id) });
}

export async function getDocumentChunks(id: number): Promise<DocumentChunksResponse> {
  const chunks = chunksByDocument[id] ?? [];
  return delay({ document_id: id, chunks, total: chunks.length });
}

// ============================================================
// Admin
// ============================================================

export async function getSystemMetrics(): Promise<SystemMetricsResponse> {
  const byStatus: Record<string, number> = {};
  for (const doc of documents) {
    byStatus[doc.status] = (byStatus[doc.status] ?? 0) + 1;
  }

  return delay({
    documents: { total: documents.length, by_status: byStatus },
    review_queue: { unreviewed_regions: regions.filter((r) => !r.reviewed).length },
    activity: {
      recent_agent_actions: actionsSince(24).length,
      recent_qa_queries: 12,
      total_submissions: 3,
    },
    timestamp: new Date().toISOString(),
  });
}

export async function getAgentActions(params?: {
  limit?: number;
  offset?: number;
  action_type?: string;
  document_id?: number;
  job_id?: string;
  success?: boolean;
}): Promise<AgentActionsListResponse> {
  let filtered = agentActions;
  if (params?.document_id !== undefined) {
    filtered = filtered.filter((a) => a.document_id === params.document_id);
  }
  if (params?.action_type) {
    filtered = filtered.filter((a) => a.action_type === params.action_type);
  }
  if (params?.job_id) {
    filtered = filtered.filter((a) => a.job_id === params.job_id);
  }
  if (params?.success !== undefined) {
    filtered = filtered.filter((a) => a.success === params.success);
  }

  const offset = params?.offset ?? 0;
  const limit = params?.limit ?? 20;

  return delay({
    actions: filtered.slice(offset, offset + limit),
    total: filtered.length,
    limit,
    offset,
  });
}

export async function getAgentActionStats(hours = 24): Promise<AgentActionStatsResponse> {
  const cutoff = new Date(Date.now() - hours * 3_600_000);
  const windowed = actionsSince(hours);

  const byType: Record<string, number> = {};
  const byDecision: Record<string, number> = {};
  for (const action of windowed) {
    byType[action.action_type] = (byType[action.action_type] ?? 0) + 1;
    byDecision[action.decision] = (byDecision[action.decision] ?? 0) + 1;
  }

  const successful = windowed.filter((a) => a.success).length;
  const confidences = windowed
    .map((a) => a.confidence)
    .filter((c): c is number => c !== null);

  return delay({
    period_hours: hours,
    total_actions: windowed.length,
    successful_actions: successful,
    success_rate: windowed.length ? successful / windowed.length : 0,
    by_action_type: byType,
    by_decision: byDecision,
    average_confidence:
      confidences.length > 0
        ? confidences.reduce((sum, c) => sum + c, 0) / confidences.length
        : null,
    cutoff: cutoff.toISOString(),
  });
}

// ============================================================
// Review
// ============================================================

export async function getFlaggedRegions(
  documentId?: number,
  reviewed = false
): Promise<LowConfidenceRegionResponse[]> {
  let filtered = regions.filter((r) => r.reviewed === reviewed);
  if (documentId !== undefined) {
    filtered = filtered.filter((r) => r.document_id === documentId);
  }
  return delay(filtered);
}

export async function getReviewStats(): Promise<ReviewStatsResponse> {
  const reviewed = regions.filter((r) => r.reviewed).length;
  const average =
    regions.length > 0
      ? regions.reduce((sum, r) => sum + r.confidence, 0) / regions.length
      : 0;

  return delay({
    total_flagged: regions.length,
    unreviewed: regions.length - reviewed,
    reviewed,
    average_confidence: average,
    review_progress: regions.length ? (reviewed / regions.length) * 100 : 0,
  });
}

// ============================================================
// Validation
// ============================================================

export async function validateDocument(documentId: number): Promise<ValidationResponse> {
  const doc = findDocument(documentId);
  const passed = doc.status !== 'Rejected';

  return delay({
    document_id: documentId,
    passed,
    rules_evaluated: 6,
    rules_failed: passed ? 0 : 1,
    failed_rules: passed
      ? []
      : [
          {
            rule_code: 'VAL-004',
            description: 'Contract number must appear in the title block.',
            severity: 'major',
          },
        ],
    warnings:
      doc.issue_status === 'Issued for Construction'
        ? []
        : [
            {
              rule_code: 'VAL-011',
              description: 'Issue status is not "Issued for Construction".',
              severity: 'minor',
            },
          ],
    validated_at: new Date().toISOString(),
  });
}

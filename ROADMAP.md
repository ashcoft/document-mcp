# Roadmap

Delivery status of the Engineering Document Control System, with completed work and the remaining
gaps. Progress is computed from the checklist items in each phase (done ÷ total), so a number only
moves when an item is finished and verified in the codebase.

- **Version:** v0.1.21
- **Last updated:** 2026-11-26
- **Legend:** ✅ done · 🟡 partial · ❌ not started

## Progress at a glance

| Phase | Area | Done | Progress |
| :---: | :--- | :---: | ---: |
| 0 | Platform and delivery foundation | 5 / 6 | 83% |
| 1 | Ingestion and extraction pipeline | 12 / 15 | 80% |
| 2 | Data model and storage | 6 / 7 | 86% |
| 3 | Retrieval and grounded Q&A | 5 / 8 | 63% |
| 4 | Validation and Document Controller handoff | 5 / 9 | 56% |
| 5 | Interfaces: MCP, REST, web UI | 7 / 9 | 78% |
| 6 | Test coverage and type safety | 3 / 8 | 38% |
| 7 | Security and compliance | 4 / 8 | 50% |
| 8 | Operations and observability | 4 / 7 | 57% |
| | **Overall** | **51 / 77** | **66%** |

### Milestones

| Milestone | Theme | State |
| :--- | :--- | :--- |
| v0.1.x | Core pipeline, REST API, SPA scaffolding, CI and releases | ✅ shipped |
| v0.2.0 | End-to-end in one process: upload → ingest → persist → validate → submit | 🟡 66% overall, blocked on the P0 items below |
| v0.3.0 | Hardening: auth, test coverage, type safety, observability | ❌ not started |
| v1.0 | Production readiness (all phases at 100% with gates enforced) | ❌ not started |

The largest correctness gap: the pipeline computes parsed fields, chunks, embeddings, and
low-confidence regions, but **nothing writes them to the database**. The orchestrator has no session
and its output is returned to the caller and dropped (`src/ingestion/orchestrator.py:105`). Search,
Q&A, and the review queue therefore read tables that no code path populates.

---

## Phase 0 — Platform and delivery foundation

**Goal:** a repository that builds, ships, and versions itself reproducibly.

- ✅ FastAPI application factory with `/health` — `src/main.py`
- ✅ Typed configuration with `.env` template — `src/config/settings.py`, `.env.example`
- ✅ Hash-pinned dependency lock installed with `--require-hashes` — `requirements-lock.txt`, `Dockerfile`
- ✅ CI gates: ruff, black, pytest, Docker build and container health check — `.github/workflows/ci.yml`
- ✅ Automated semantic-release versioning and changelog — `pyproject.toml`, `.github/workflows/release.yml`
- ❌ Local stack orchestration: no Compose file exists, although the README documents a `docker/`
  directory and a four-service stack (app, PostgreSQL + pgvector, Redis, Ollama)

**Remaining:** add a Compose stack so a clean checkout can run the full system with one command.

## Phase 1 — Ingestion and extraction pipeline

**Goal:** turn any supported file into parsed, chunked, embedded records.

- ✅ Format routing for PDF, DWG/DXF, Office, images — `src/ingestion/router.py`
- ✅ PDF text extraction — `src/ingestion/pdf_extractor.py`
- ✅ CAD extraction (DXF native, DWG via ODA File Converter) — `src/ingestion/cad_extractor.py`
- ✅ Office extraction for DOCX/XLSX/PPTX — `src/ingestion/office_extractor.py`
- ✅ Image extraction — `src/ingestion/image_extractor.py`
- ✅ OCR engine with PaddleOCR primary and Tesseract fallback — `src/ocr/engine.py`
- ✅ Confidence gating that produces `LowConfidenceRegion` objects — `src/ocr/confidence.py`
- ✅ Deterministic regex parser — `src/parser/deterministic.py`
- ✅ Local LLM extraction with merge pass — `src/parser/llm_extractor.py`, `src/parser/merge.py`
- ✅ Parent/child chunking — `src/embeddings/chunking.py`
- ✅ On-device embeddings with LRU cache — `src/embeddings/encoder.py`
- ✅ Orchestrator sequencing extraction, parsing, chunking, and embedding —
  `src/ingestion/orchestrator.py:34`
- ❌ Persist pipeline output: parsed fields, parent/child chunks, embeddings, and low-confidence
  regions are returned as a dict and discarded; no session or repository writes them
  (`src/ingestion/orchestrator.py:105`)
- ❌ Background execution: the upload endpoint stores the record and stops; there is no Celery task
  or worker, so nothing in the running app calls the orchestrator (`src/api/routers/upload.py:109`)
- ❌ Per-stage progress: the orchestrator never writes status back, and the status endpoint returns a
  hardcoded 50/100 (`src/api/routers/upload.py:159`)

**Remaining:** persist results, enqueue ingestion on upload, and report real progress over REST and
WebSocket. Until persistence lands, search, Q&A, and the review queue have no data.

## Phase 2 — Data model and storage

**Goal:** audit-grade, SQL-only persistence.

- ✅ 12-table schema covering documents, revisions, comments, legends, equipment ratings, drawing
  index, rules, submissions, review regions, chunks, Q&A log, agent actions — `src/db/models.py`
- ✅ Alembic migrations 0001 (core schema) and 0002 (agent actions) — `alembic/versions/`
- ✅ pgvector extension with IVFFlat cosine index on chunk embeddings —
  `alembic/versions/0001_initial_schema.py:158`
- ✅ Async SQLAlchemy 2.0 session management — `src/db/session.py`
- ✅ Content-addressed file storage keyed by SHA-256 — `src/storage/files.py`
- ✅ Idempotent uploads: duplicate hashes return the existing document — `src/api/routers/upload.py`
- ❌ Retention policy: no cleanup or quota job for uploaded files and derived previews

**Remaining:** retention/cleanup for `UPLOAD_DIR` and `PREVIEW_DIR`. The missing write path for
chunks and embeddings is tracked in Phase 1.

## Phase 3 — Retrieval and grounded Q&A

**Goal:** answers with verifiable citations, fully offline.

- ✅ Hybrid retrieval over pgvector cosine distance and PostgreSQL full-text search, weighted merge
  (0.6 / 0.4) — `src/search/hybrid.py`
- ✅ Discipline and document-ID filters — `src/search/hybrid.py`
- ✅ Grounded answer generation with citation extraction — `src/search/qa.py`, `src/llm/client.py`
- ✅ Ollama client with a fallback model on failure — `src/llm/client.py`
- ✅ Q&A query logging table — `src/db/models.py`
- ❌ Reranking: merged candidates are scored only by the two retrieval signals
- ❌ Retrieval evaluation: no golden query set, no recall@k or answer-faithfulness harness
- ❌ Streaming answers: the WebSocket channel carries job status only, not token streams

**Remaining:** reranking, an offline evaluation harness, and streamed answers. Retrieval quality
cannot be measured until Phase 1 persistence lands.

## Phase 4 — Validation and Document Controller handoff

**Goal:** rule-driven accept/reject, then hand off approved documents.

- ✅ Database-driven rules engine with discipline scoping — `src/validation/gateway.py`
- ✅ JSONB rejection notes in Client Comment / Response form — `src/validation/rejection.py`
- ✅ Discipline submission records with confirmation reference — `src/db/models.py`
- ✅ Document Controller HTTP client with payload builder and timeout —
  `src/submission/docon_client.py`
- ✅ Validation exposed through REST and the MCP tool — `src/api/routers/validation.py`,
  `src/mcp/server.py`
- ❌ Validation is never called by the ingest flow: the MCP ingest tool marks a document `Approved`
  as soon as the pipeline returns, without evaluating rules (`src/mcp/server.py:99`)
- ❌ Rule cache invalidation: `last_reload` is assigned but never read, and
  `VALIDATION_RULE_RELOAD_INTERVAL` is unused (`src/validation/gateway.py:21`)
- ❌ Submission resilience: no retry, backoff, or idempotency key on handoff
- ❌ Contract tests: the Document Controller integration is untested against a stub server

**Remaining:** invoke the gateway in the ingest flow, return the rejection note from
`discipline_submissions` (`src/api/routers/upload.py:167`), add retry/backoff, and add contract tests.

## Phase 5 — Interfaces: MCP, REST, web UI

**Goal:** every capability reachable from an agent, a script, or a browser.

- ✅ Four MCP tools: ingest, validate, search, submit — `src/mcp/server.py`
- ✅ MCP stdio transport — `src/mcp/server.py:330`
- ✅ REST endpoints for upload, status, search, ask, documents, review, validation, admin —
  `src/api/routers/`
- ✅ WebSocket status channel — `src/api/routers/websocket.py`
- ✅ Vue 3 + Vuetify SPA with dashboard, upload, ask, documents, detail, and review views —
  `frontend/src/views/`
- ✅ Playwright smoke coverage of navigation and screens — `frontend/e2e/app.spec.ts`
- ✅ CORS configuration for the local dev origins — `src/main.py`
- ❌ Streamable HTTP MCP: the README documents Streamable HTTP, but the server runs stdio-only and is
  not mounted in the FastAPI app
- ❌ SPA delivery: the backend does not serve `frontend/dist` and the Docker image does not build or
  copy the frontend, so the container exposes no dashboard

**Remaining:** mount MCP over Streamable HTTP at a stable path and serve the built SPA from the
container.

## Phase 6 — Test coverage and type safety

**Goal:** regressions caught before merge.

- ✅ pytest infrastructure with async mode and shared fixtures — `tests/conftest.py`, `pyproject.toml`
- ✅ Hashing unit tests (15 cases) — `tests/test_hashing.py`
- ✅ Settings unit tests (12 cases) — `tests/test_settings.py`
- ❌ Extractor, parser, chunker, and search tests
- ❌ API integration tests against a test database
- ❌ MCP tool tests
- ❌ `mypy --strict` gate: installed and configured, but the CI step is commented out
  (`.github/workflows/ci.yml:53-56`)
- ❌ Coverage threshold: `pytest --cov` is documented but not enforced in CI

**Remaining:** this is the weakest phase. Pipeline and API tests plus a coverage floor are the
highest-value next investment after persistence.

## Phase 7 — Security and compliance

**Goal:** safe defaults for an on-premise deployment.

- ✅ Non-root container user and health check — `Dockerfile`
- ✅ Fully pinned, hash-verified dependencies — `requirements-lock.txt`
- ✅ Supply-chain gates: Bandit, Trivy, and Dependency Review — `.github/workflows/security.yml`;
  CodeQL default setup and the Snyk app are also enabled on the repository
- ✅ Audit trail with SHA-256 hashes, model version, and per-operation logs — `src/common/audit.py`
- ❌ Authentication and authorization: `ADMIN_USERNAME`, `ADMIN_PASSWORD_HASH`, and `SECRET_KEY` are
  defined in settings but no route enforces them, so review and admin endpoints are open
- ❌ Secret handling: the default `SECRET_KEY` is a placeholder and nothing rejects it at startup
- ❌ Artifact integrity: no SBOM and no image signing
- ❌ Abuse limits: `MAX_UPLOAD_SIZE_MB` is defined but never enforced; the upload handler reads the
  whole file into memory

**Remaining:** authenticate admin and review routes, fail fast on placeholder secrets, enforce the
upload limit, and publish an SBOM with signed images.

## Phase 8 — Operations and observability

**Goal:** operable by an on-call engineer without reading the source.

- ✅ Health endpoint and container health check — `src/main.py`, `Dockerfile`
- ✅ Admin metrics endpoint — `src/api/routers/admin.py`
- ✅ Agent action audit and aggregate stats — `src/api/routers/admin.py`, `src/db/models.py`
- ✅ Deployment and recovery guides — `REAL_BACKEND_SETUP.md`, `INGESTION_GUIDE.md`,
  `RESET_POSTGRES_PASSWORD.md`
- ❌ Structured JSON logging: `LOG_FORMAT` is configurable but never read; logging is plain text
  (`src/main.py`)
- ❌ Metrics export: no Prometheus or OpenTelemetry endpoint
- ❌ Backup and restore: no documented procedure for PostgreSQL plus the file store

**Remaining:** wire structured logging, export metrics, and document backup/restore.

---

## Prioritized backlog

### P0 — unblocks v0.2.0 (end-to-end in one process)

| # | Item | Done when |
| :---: | :--- | :--- |
| 1 | Persist pipeline output | A processed document leaves rows in `reference_documents`, `document_chunks` (with embeddings), and `low_confidence_regions` |
| 2 | Enqueue ingestion from upload | Uploading a PDF through the API reaches `Approved` or `Rejected` with no manual script, driven by a Celery worker |
| 3 | Run validation in the ingest flow | Status is decided by the rules engine, and the rejection note is stored and returned by `/api/upload/status` |
| 4 | Persist stage progress | `/api/upload/status` and the WebSocket report the real stage and percentage instead of 50/100 |
| 5 | Mount MCP over Streamable HTTP | An MCP client connects to the running container and lists all four tools |
| 6 | Compose stack | `docker compose up` starts app, PostgreSQL + pgvector, Redis, and Ollama with migrations applied |
| 7 | Serve the SPA | The image builds the frontend and serves it from the backend origin |

### P1 — hardening for v0.3.0

| # | Item | Done when |
| :---: | :--- | :--- |
| 8 | AuthN/AuthZ | Review and admin routes reject unauthenticated requests in tests |
| 9 | Pipeline and API tests | Extractor, parser, chunker, search, and API flows covered against a test database |
| 10 | Coverage gate | CI fails below an agreed coverage floor |
| 11 | Type safety | `mypy --strict src/` runs in CI and passes |
| 12 | Rule cache invalidation | Rules reload after `VALIDATION_RULE_RELOAD_INTERVAL` without a restart |
| 13 | Submission resilience | Retries with backoff plus an idempotency key on Document Controller handoff |
| 14 | Upload limits | Oversized uploads are rejected with 413 before the body is buffered |
| 15 | Structured logging | `LOG_FORMAT=json` emits parseable JSON lines |

### P2 — scale and assurance

| # | Item | Done when |
| :---: | :--- | :--- |
| 16 | Reranking | Cross-encoder or reciprocal-rank fusion improves recall@10 on the golden set |
| 17 | Retrieval evaluation | Golden query set with recall@k and answer-faithfulness reports in CI |
| 18 | Metrics export | Prometheus endpoint covering ingestion latency, queue depth, and LLM error rate |
| 19 | Supply chain | SBOM published and images signed, verified in CI |
| 20 | Storage retention | Configurable cleanup for uploads and previews with a dry-run mode |
| 21 | Frontend tests | Component tests for upload, ask, and review flows |

## Verification gates today

| Gate | Enforced |
| :--- | :--- |
| ruff + black | ✅ |
| pytest (unit) | ✅ |
| Docker build + container health check | ✅ |
| Bandit, Trivy, Dependency Review | ✅ |
| CodeQL, Snyk | ✅ |
| Playwright smoke tests | ✅ |
| mypy strict | ❌ disabled |
| Coverage floor | ❌ absent |
| API and MCP integration tests | ❌ absent |

## How to update this roadmap

1. Flip an item to ✅ only when the change is merged and its verification gate passes.
2. Recount the phase row and the overall row; percentages are done ÷ total, rounded to the nearest whole percent.
3. Add newly discovered gaps to the phase checklist and to the backlog with a P-level.
4. Keep the "Last updated" line and version in step with `pyproject.toml`.

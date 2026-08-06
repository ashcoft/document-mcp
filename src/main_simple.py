"""Simple backend server for testing frontend connection."""

from __future__ import annotations

import logging
import secrets
import traceback
from datetime import datetime, timedelta
from typing import Any

from fastapi import FastAPI, File, Form, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

logger = logging.getLogger(__name__)

# Constants to avoid duplication
SINGLE_LINE_DIAGRAM_TITLE = "Single Line Diagram - Main Substation"
OLLAMA_LLAMA3_MODEL = "ollama/llama3:8b"

app = FastAPI()

# Simulate job progress storage
job_progress: dict[str, dict[str, Any]] = {}

# Simulate document storage
documents: dict[int, dict[str, Any]] = {
    1: {
        "id": 1,
        "document_number": "DOC-ELC-001",
        "title": SINGLE_LINE_DIAGRAM_TITLE,
        "revision": "B",
        "issue_status": "Final",
        "contract_number": "CN-2024-001",
        "discipline": "ELC",
        "page_count": 5,
        "status": "Approved",
        "created_at": "2024-01-15T10:30:00",
        "updated_at": "2024-06-20T14:45:00",
    },
    2: {
        "id": 2,
        "document_number": "DOC-MEC-002",
        "title": "Mechanical Equipment Layout",
        "revision": "A",
        "issue_status": "For Construction",
        "contract_number": "CN-2024-002",
        "discipline": "MEC",
        "page_count": 12,
        "status": "Approved",
        "created_at": "2024-02-10T09:15:00",
        "updated_at": "2024-07-01T11:20:00",
    },
    3: {
        "id": 3,
        "document_number": "DOC-INS-003",
        "title": "Instrumentation Loop Diagrams",
        "revision": "C",
        "issue_status": "Final",
        "contract_number": "CN-2024-003",
        "discipline": "INS",
        "page_count": 8,
        "status": "Approved",
        "created_at": "2024-03-05T14:00:00",
        "updated_at": "2024-07-10T16:30:00",
    },
    4: {
        "id": 4,
        "document_number": "DOC-SIM-004",
        "title": "Simulation Model Validation Report",
        "revision": "1",
        "issue_status": "Draft",
        "contract_number": "CN-2024-004",
        "discipline": "SIM",
        "page_count": 3,
        "status": "Checking",
        "created_at": "2024-07-20T08:00:00",
        "updated_at": "2024-07-25T10:00:00",
    },
}

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:5174", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
async def health_check() -> dict[str, str]:
    return {"status": "healthy"}


# ============================================================
# Upload endpoints
# ============================================================


@app.post("/api/upload/")
async def upload_document(
    file: UploadFile = File(...),
    discipline: str | None = Form(default=None),
) -> JSONResponse:
    try:
        job_id = f"job-{secrets.randbelow(9000) + 1000}"
        filename = file.filename or "test.pdf"
        doc_id = secrets.randbelow(100) + 1
        job_progress[job_id] = {
            "status": "Checking",
            "progress": 0,
            "document_id": doc_id,
            "filename": filename,
        }
        return JSONResponse(
            {
                "job_id": job_id,
                "document_id": doc_id,
                "filename": filename,
                "status": "Checking",
                "message": "Document uploaded successfully. Processing will begin shortly.",
            }
        )
    except Exception as e:
        logger.error("Upload failed: %s\n%s", str(e), traceback.format_exc())
        return JSONResponse({"error": "Upload failed"}, status_code=500)


@app.get("/api/upload/status/{job_id}")
async def get_upload_status(job_id: str) -> JSONResponse:
    if job_id not in job_progress:
        job_progress[job_id] = {
            "status": "Checking",
            "progress": 0,
            "document_id": 1,
            "filename": "test.pdf",
        }

    job = job_progress[job_id]

    # Simulate progress
    if job["progress"] < 100:
        job["progress"] = min(job["progress"] + 10, 100)
        if job["progress"] >= 100:
            job["progress"] = 100
            job["status"] = "Approved"
        elif job["progress"] >= 50:
            job["status"] = "Processing"
        else:
            job["status"] = "Checking"

    return JSONResponse(
        {
            "job_id": job_id,
            "document_id": job["document_id"],
            "status": job["status"],
            "progress": job["progress"],
            "message": None,
            "rejection_note": None,
            "created_at": datetime.now().isoformat(),
            "updated_at": datetime.now().isoformat(),
        }
    )


# ============================================================
# Search & Q&A endpoints
# ============================================================


@app.post("/api/search")
async def search_documents() -> JSONResponse:
    return JSONResponse(
        {
            "query": "test",
            "results": [
                {
                    "chunk_id": 1,
                    "content": "The main transformer has a rated voltage of 33kV on the primary side and 11kV on the secondary side. The transformer is rated at 10MVA.",
                    "document_id": 1,
                    "document_number": "DOC-ELC-001",
                    "title": SINGLE_LINE_DIAGRAM_TITLE,
                    "discipline": "ELC",
                    "score": 0.92,
                    "search_type": "semantic",
                },
                {
                    "chunk_id": 2,
                    "content": "Equipment ratings: Transformer TR-001, 33/11kV, 10MVA, Dyn11, impedance 8.5%",
                    "document_id": 1,
                    "document_number": "DOC-ELC-001",
                    "title": SINGLE_LINE_DIAGRAM_TITLE,
                    "discipline": "ELC",
                    "score": 0.85,
                    "search_type": "keyword",
                },
            ],
            "total": 2,
        }
    )


@app.post("/api/ask")
async def ask_question() -> JSONResponse:
    return JSONResponse(
        {
            "answer": "The main transformer (TR-001) has a rated voltage of 33kV on the primary side and 11kV on the secondary side, with a power rating of 10MVA. The vector group is Dyn11 with an impedance of 8.5%.",
            "confidence": "High",
            "citations": [
                {
                    "document_number": "DOC-ELC-001",
                    "title": SINGLE_LINE_DIAGRAM_TITLE,
                    "page_or_sheet": "Sheet 1, Page 2",
                }
            ],
            "query": "test",
            "context_chunks_used": 3,
        }
    )


# ============================================================
# Document endpoints
# ============================================================


@app.get("/api/documents")
async def get_documents(
    page: int = 1,
    page_size: int = 20,
    discipline: str | None = None,
    status: str | None = None,
) -> JSONResponse:
    # Filter documents
    filtered = list(documents.values())
    if discipline:
        filtered = [d for d in filtered if d.get("discipline") == discipline]
    if status:
        filtered = [d for d in filtered if d.get("status") == status]
    else:
        # Default to approved documents
        filtered = [d for d in filtered if d.get("status") == "Approved"]

    total = len(filtered)
    start = (page - 1) * page_size
    end = start + page_size
    paginated = filtered[start:end]

    return JSONResponse(
        {"documents": paginated, "total": total, "page": page, "page_size": page_size}
    )


@app.get("/api/documents/{document_id}")
async def get_document(document_id: int) -> JSONResponse:
    if document_id in documents:
        return JSONResponse(documents[document_id])
    return JSONResponse({"detail": "Document not found"}, status_code=404)


# ============================================================
# Document content/chunks endpoint (for preview)
# ============================================================

# Mock document chunks for preview
document_chunks: dict[int, list[dict[str, Any]]] = {
    1: [
        {
            "id": 1,
            "document_id": 1,
            "level": "parent",
            "content": "SINGLE LINE DIAGRAM - MAIN SUBSTATION\n\nDocument Number: DOC-ELC-001\nRevision: B\nIssue Status: Final\nDiscipline: Electrical (ELC)\n\nThis document presents the single line diagram for the main substation, including all major electrical equipment, their ratings, and interconnections.\n\nSheet 1: Main Single Line Diagram\nThe main substation receives power at 33kV from the utility grid. The incoming feeder connects to a 33kV vacuum circuit breaker (VCB-001), which feeds the primary side of the main transformer (TR-001).\n\nTransformer TR-001 Specifications:\n- Rated Voltage: 33kV / 11kV\n- Rated Power: 10 MVA\n- Vector Group: Dyn11\n- Impedance: 8.5%\n- Cooling: ONAN/ONAF\n\nThe secondary side of TR-001 at 11kV connects through another vacuum circuit breaker (VCB-002) to the 11kV switchgear bus. From the 11kV bus, multiple outgoing feeders distribute power to various plant areas.",
            "token_count": 180,
            "page": 1,
        },
        {
            "id": 2,
            "document_id": 1,
            "level": "child",
            "content": "Sheet 2: Equipment Ratings Table\n\n| Tag | Equipment | Rating | Voltage | Phase | Frequency |\n|-----|-----------|--------|---------|-------|-----------|\n| TR-001 | Main Transformer | 10 MVA | 33/11kV | 3-Phase | 50 Hz |\n| VCB-001 | Vacuum CB (Primary) | 1200A | 33kV | 3-Phase | 50 Hz |\n| VCB-002 | Vacuum CB (Secondary) | 2000A | 11kV | 3-Phase | 50 Hz |\n| CT-001 | Current Transformer | 600/5A | 33kV | - | - |\n| PT-001 | Potential Transformer | 33000/110V | 33kV | - | - |\n| TR-002 | Auxiliary Transformer | 100 kVA | 11/0.4kV | 3-Phase | 50 Hz |\n\nProtection System:\n- Overcurrent Protection: 50/51 relay on both primary and secondary\n- Differential Protection: 87T for transformer protection\n- Earth Fault Protection: 51N on neutral\n- Buchholz Relay for internal transformer faults",
            "token_count": 150,
            "page": 2,
        },
        {
            "id": 3,
            "document_id": 1,
            "level": "child",
            "content": "Sheet 3: Legend and Notes\n\nLegend Symbols:\n- □ : Circuit Breaker (Vacuum)\n- ○ : Current Transformer\n- ⌁ : Potential Transformer\n- △ : Delta Connection\n- Y : Wye (Star) Connection\n- ⏚ : Earth/Ground Connection\n\nGeneral Notes:\n1. All equipment shall comply with IEC 62271 standard for high-voltage switchgear.\n2. Transformer impedance shall be 8.5% as specified.\n3. Protection relays shall be numerical type with communication capability.\n4. All CT secondary circuits shall be grounded at one point only.\n5. Cable sizing shall be based on short circuit current of 25kA for 1 second.\n\nRevision History:\n| Rev | Date | Description | Prepared By | Checked By | Approved By |\n|-----|------|-------------|-------------|------------|-------------|\n| A | 2024-01-15 | Initial Issue | J. Smith | M. Johnson | R. Brown |\n| B | 2024-06-20 | Updated transformer rating | J. Smith | M. Johnson | R. Brown |",
            "token_count": 160,
            "page": 3,
        },
    ],
    2: [
        {
            "id": 4,
            "document_id": 2,
            "level": "parent",
            "content": "MECHANICAL EQUIPMENT LAYOUT\n\nDocument Number: DOC-MEC-002\nRevision: A\nIssue Status: For Construction\nDiscipline: Mechanical (MEC)\n\nThis document presents the mechanical equipment layout for the plant area, showing the placement of all major mechanical equipment, piping, and support structures.\n\nEquipment List:\n1. Pump P-001: Centrifugal pump, 150kW, 1500 RPM\n2. Pump P-002: Centrifugal pump, 75kW, 1500 RPM\n3. Compressor C-001: Screw compressor, 250kW\n4. Heat Exchanger HX-001: Shell and tube, 2MW capacity\n5. Storage Tank T-001: 50m³ capacity, stainless steel\n\nLayout Description:\nThe mechanical equipment is arranged in a logical flow pattern. Pumps P-001 and P-002 are located near the process area, with the compressor C-001 positioned adjacent to provide compressed air. The heat exchanger HX-001 is placed between the process and utility areas. Storage tank T-001 is located in the tank farm area with appropriate secondary containment.",
            "token_count": 170,
            "page": 1,
        },
    ],
    3: [
        {
            "id": 5,
            "document_id": 3,
            "level": "parent",
            "content": "INSTRUMENTATION LOOP DIAGRAMS\n\nDocument Number: DOC-INS-003\nRevision: C\nIssue Status: Final\nDiscipline: Instrumentation (INS)\n\nThis document contains instrumentation loop diagrams for the main process control loops.\n\nLoop 1: Temperature Control Loop (TIC-101)\n- Sensor: RTD PT100, Range 0-200°C\n- Transmitter: TT-101, 4-20mA output\n- Controller: TIC-101, PID control\n- Control Valve: TV-101, pneumatic actuator\n\nLoop 2: Pressure Control Loop (PIC-201)\n- Sensor: Pressure Transmitter PT-201, Range 0-10 bar\n- Controller: PIC-201, PID control\n- Control Valve: PV-201, pneumatic actuator\n\nLoop 3: Flow Control Loop (FIC-301)\n- Sensor: Electromagnetic Flow Meter FT-301\n- Controller: FIC-301, PID control\n- Control Valve: FV-301, motorized",
            "token_count": 140,
            "page": 1,
        },
    ],
    4: [
        {
            "id": 6,
            "document_id": 4,
            "level": "parent",
            "content": "SIMULATION MODEL VALIDATION REPORT\n\nDocument Number: DOC-SIM-004\nRevision: 1\nIssue Status: Draft\nDiscipline: Simulation (SIM)\n\nThis report presents the validation results of the simulation model against actual plant performance data.\n\nExecutive Summary:\nThe simulation model was validated against operational data collected over a 30-day period. The model shows good correlation with actual data, with an average error of less than 5% across all key parameters.\n\nValidation Results:\n- Temperature accuracy: ±2.1°C (within acceptable range)\n- Pressure accuracy: ±0.3 bar (within acceptable range)\n- Flow rate accuracy: ±3.2% (within acceptable range)\n- Energy balance: 98.7% closure (acceptable)\n\nRecommendations:\n1. Fine-tune heat transfer coefficients for the heat exchanger model\n2. Update pump efficiency curves based on actual performance data\n3. Consider adding dynamic response modeling for startup/shutdown scenarios",
            "token_count": 160,
            "page": 1,
        },
    ],
}


@app.get("/api/documents/{document_id}/chunks")
async def get_document_chunks(document_id: int) -> JSONResponse:
    """Get document chunks for preview."""
    if document_id in document_chunks:
        chunks = document_chunks[document_id]
        return JSONResponse(
            {
                "document_id": document_id,
                "chunks": chunks,
                "total": len(chunks),
            }
        )
    return JSONResponse(
        {
            "document_id": document_id,
            "chunks": [],
            "total": 0,
        }
    )


# ============================================================
# Admin endpoints
# ============================================================


@app.get("/api/admin/metrics")
async def get_system_metrics() -> JSONResponse:
    approved = sum(1 for d in documents.values() if d["status"] == "Approved")
    checking = sum(1 for d in documents.values() if d["status"] == "Checking")
    rejected = sum(1 for d in documents.values() if d["status"] == "Rejected")

    return JSONResponse(
        {
            "documents": {
                "total": len(documents),
                "by_status": {
                    "Approved": approved,
                    "Checking": checking,
                    "Rejected": rejected,
                },
            },
            "review_queue": {
                "unreviewed_regions": 3,
            },
            "activity": {
                "recent_agent_actions": 12,
                "recent_qa_queries": 5,
                "total_submissions": len(documents),
            },
            "timestamp": datetime.now().isoformat(),
        }
    )


@app.get("/api/admin/actions")
async def get_agent_actions(
    limit: int = 100,
    offset: int = 0,
    action_type: str | None = None,
    document_id: int | None = None,
    job_id: str | None = None,
    success: bool | None = None,
) -> JSONResponse:
    actions = [
        {
            "id": 1,
            "document_id": 1,
            "job_id": "job-1001",
            "action_type": "ocr_quality_eval",
            "decision": "proceed",
            "reasoning": "OCR confidence above threshold (92%). Document quality is acceptable.",
            "context": {"confidence": 0.92, "threshold": 0.8},
            "model_version": OLLAMA_LLAMA3_MODEL,
            "confidence": 0.92,
            "success": True,
            "created_at": (datetime.now() - timedelta(hours=2)).isoformat(),
        },
        {
            "id": 2,
            "document_id": 1,
            "job_id": "job-1001",
            "action_type": "parse_strategy",
            "decision": "fallback",
            "reasoning": "PDF parsing failed, falling back to OCR-based extraction.",
            "context": {"strategy": "ocr_fallback"},
            "model_version": OLLAMA_LLAMA3_MODEL,
            "confidence": 0.85,
            "success": True,
            "created_at": (datetime.now() - timedelta(hours=1, minutes=30)).isoformat(),
        },
        {
            "id": 3,
            "document_id": 1,
            "job_id": "job-1001",
            "action_type": "validation_decision",
            "decision": "proceed",
            "reasoning": "All validation rules passed. Document approved for reference.",
            "context": {"rules_passed": 5, "rules_failed": 0},
            "model_version": OLLAMA_LLAMA3_MODEL,
            "confidence": 0.95,
            "success": True,
            "created_at": (datetime.now() - timedelta(hours=1)).isoformat(),
        },
    ]

    # Apply filters
    if document_id:
        actions = [a for a in actions if a["document_id"] == document_id]
    if action_type:
        actions = [a for a in actions if a["action_type"] == action_type]
    if success is not None:
        actions = [a for a in actions if a["success"] == success]

    total = len(actions)
    paginated = actions[offset : offset + limit]

    return JSONResponse(
        {
            "actions": paginated,
            "total": total,
            "limit": limit,
            "offset": offset,
        }
    )


@app.get("/api/admin/actions/stats")
async def get_agent_action_stats(hours: int = 24) -> JSONResponse:
    return JSONResponse(
        {
            "period_hours": hours,
            "total_actions": 12,
            "successful_actions": 11,
            "success_rate": 91.7,
            "by_action_type": {
                "ocr_quality_eval": 4,
                "parse_strategy": 3,
                "validation_decision": 5,
            },
            "by_decision": {
                "proceed": 9,
                "fallback": 2,
                "flag_for_review": 1,
            },
            "average_confidence": 0.887,
            "cutoff": (datetime.now() - timedelta(hours=hours)).isoformat(),
        }
    )


# ============================================================
# Review endpoints
# ============================================================


@app.get("/api/review/flagged")
async def get_flagged_regions(
    document_id: int | None = None,
    reviewed: bool = False,
) -> JSONResponse:
    regions = [
        {
            "id": 1,
            "document_id": 1,
            "page": 2,
            "bbox": {"x1": 100, "y1": 200, "x2": 300, "y2": 250},
            "text": "33kV/11kV transformer",
            "confidence": 0.65,
            "reviewed": False,
            "reviewed_by": None,
            "reviewed_at": None,
            "created_at": (datetime.now() - timedelta(hours=5)).isoformat(),
        },
        {
            "id": 2,
            "document_id": 1,
            "page": 3,
            "bbox": {"x1": 50, "y1": 100, "x2": 200, "y2": 150},
            "text": "Dyn11 vector group",
            "confidence": 0.58,
            "reviewed": False,
            "reviewed_by": None,
            "reviewed_at": None,
            "created_at": (datetime.now() - timedelta(hours=4)).isoformat(),
        },
        {
            "id": 3,
            "document_id": 2,
            "page": 1,
            "bbox": {"x1": 200, "y1": 300, "x2": 400, "y2": 350},
            "text": "Equipment rating: 150kW",
            "confidence": 0.42,
            "reviewed": False,
            "reviewed_by": None,
            "reviewed_at": None,
            "created_at": (datetime.now() - timedelta(hours=3)).isoformat(),
        },
    ]

    if document_id:
        regions = [r for r in regions if r["document_id"] == document_id]

    return JSONResponse(regions)


@app.get("/api/review/stats/summary")
async def get_review_stats() -> JSONResponse:
    return JSONResponse(
        {
            "total_flagged": 3,
            "unreviewed": 3,
            "reviewed": 0,
            "average_confidence": 0.55,
            "review_progress": 0.0,
        }
    )


# ============================================================
# Validation endpoints
# ============================================================


@app.post("/api/validation/{document_id}")
async def validate_document(document_id: int) -> JSONResponse:
    return JSONResponse(
        {
            "document_id": document_id,
            "passed": True,
            "rules_evaluated": 5,
            "rules_failed": 0,
            "failed_rules": [],
            "warnings": [
                {
                    "rule": "check_revision_format",
                    "message": "Revision format uses non-standard naming.",
                }
            ],
            "validated_at": datetime.now().isoformat(),
        }
    )


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="127.0.0.1", port=8000)  # nosec: B104 - bind to localhost for security

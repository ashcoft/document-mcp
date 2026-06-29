"""Application entry point for the Engineering Document Control System."""
import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from src.config.settings import settings
from src.api.routers import upload, search, documents, review, viewer

# Configure logging
logging.basicConfig(
    level=getattr(logging, settings.log_level.upper()),
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan events."""
    logger.info("Starting Engineering Document Control System")
    logger.info(f"CAD Viewer enabled: {settings.cad_viewer_enabled}")
    yield
    logger.info("Shutting down Engineering Document Control System")


def create_app() -> FastAPI:
    """Create and configure the FastAPI application."""
    app = FastAPI(
        title="Engineering Document Control System",
        description="Fully offline, on-premise engineering document-control knowledge base with CAD visualization",
        version="0.1.0",
        lifespan=lifespan,
    )

    # CORS middleware
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["http://localhost:5173", "http://localhost:3000"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # Include routers
    app.include_router(upload.router, prefix="/api")
    app.include_router(search.router, prefix="/api")
    app.include_router(documents.router, prefix="/api")
    app.include_router(review.router, prefix="/api")
    
    # CAD viewer router (only if enabled)
    if settings.cad_viewer_enabled:
        app.include_router(viewer.router, prefix="/api")
        logger.info("CAD viewer endpoints enabled")

    @app.get("/health")
    async def health_check():
        return {
            "status": "healthy",
            "cad_viewer_enabled": settings.cad_viewer_enabled,
        }

    return app


app = create_app()

if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "src.main:app",
        host=settings.web_host,
        port=settings.web_port,
        reload=True,
        log_level=settings.log_level.lower(),
    )
"""CAD viewer router for DWG/DXF file handling and visualization."""
import logging
from pathlib import Path
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Path as PathParam
from fastapi.responses import FileResponse
from sqlalchemy.ext.asyncio import AsyncSession

from src.db.session import get_db
from src.db.models import ReferenceDocument
from src.storage.files import file_storage
from src.ingestion.cad_extractor import cad_extractor
from src.config.settings import settings

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/viewer", tags=["viewer"])


@router.get("/status/{job_id}")
async def get_viewer_status(
    job_id: str,
    db: AsyncSession = Depends(get_db),
):
    """
    Get CAD viewer status and file availability.
    
    Args:
        job_id: Job ID from upload
        db: Database session
        
    Returns:
        Viewer status with file path
    """
    try:
        from sqlalchemy import select
        
        result = await db.execute(
            select(ReferenceDocument).where(ReferenceDocument.job_id == job_id)
        )
        document = result.scalar_one_or_none()
        
        if not document:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Document not found: {job_id}",
            )
        
        file_path = Path(document.original_path)
        file_exists = file_path.exists() if file_path else False
        is_cad = file_path.suffix.lower() in [".dwg", ".dxf"] if file_path else False
        
        return {
            "job_id": job_id,
            "document_id": document.id,
            "file_exists": file_exists,
            "is_cad_file": is_cad,
            "file_path": str(file_path) if file_path else None,
            "status": document.status,
        }
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Viewer status check failed: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Viewer status check failed: {str(e)}",
        )


@router.get("/preview/{job_id}")
async def get_cad_preview(
    job_id: str,
    page: int = 1,
    dpi: int = 150,
    db: AsyncSession = Depends(get_db),
):
    """
    Generate raster preview of CAD file for OCR processing.
    
    Args:
        job_id: Job ID from upload
        page: Page number (default 1 for CAD)
        dpi: Resolution for preview (default 150)
        db: Database session
        
    Returns:
        PNG image of the CAD drawing
    """
    try:
        from sqlalchemy import select
        
        result = await db.execute(
            select(ReferenceDocument).where(ReferenceDocument.job_id == job_id)
        )
        document = result.scalar_one_or_none()
        
        if not document:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Document not found: {job_id}",
            )
        
        file_path = Path(document.original_path)
        if not file_path.exists():
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="CAD file not found on disk",
            )
        
        # Check if file is CAD format
        if file_path.suffix.lower() not in [".dwg", ".dxf"]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="File is not a CAD format (DWG/DXF)",
            )
        
        # Generate preview
        preview_path = file_storage.get_preview_path(document.id, page)
        
        if not preview_path.exists():
            # Generate raster preview using cad_extractor
            import io
            from PIL import Image
            
            image = cad_extractor._render_cad_to_image(file_path, dpi=dpi)
            image.save(preview_path, "PNG")
        
        return FileResponse(
            preview_path,
            media_type="image/png",
            filename=f"preview_{document.id}_page_{page}.png",
        )
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"CAD preview generation failed: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Preview generation failed: {str(e)}",
        )


@router.get("/attributes/{job_id}")
async def get_cad_attributes(
    job_id: str,
    db: AsyncSession = Depends(get_db),
):
    """
    Extract attributes from CAD file (layers, blocks, text entities).
    
    Args:
        job_id: Job ID from upload
        db: Database session
        
    Returns:
        Structured attribute data from the CAD file
    """
    try:
        from sqlalchemy import select
        
        result = await db.execute(
            select(ReferenceDocument).where(ReferenceDocument.job_id == job_id)
        )
        document = result.scalar_one_or_none()
        
        if not document:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Document not found: {job_id}",
            )
        
        file_path = Path(document.original_path)
        if not file_path.exists():
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="CAD file not found on disk",
            )
        
        # Check if file is CAD format
        if file_path.suffix.lower() not in [".dwg", ".dxf"]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="File is not a CAD format (DWG/DXF)",
            )
        
        # Extract attributes using cad_extractor
        extraction_result = cad_extractor.extract(file_path)
        
        return {
            "job_id": job_id,
            "document_id": document.id,
            "title_block": extraction_result.get("title_block", {}),
            "extraction_method": extraction_result.get("extraction_method", "unknown"),
            "text_preview": extraction_result.get("text", "")[:1000],  # First 1000 chars
        }
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"CAD attribute extraction failed: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Attribute extraction failed: {str(e)}",
        )


@router.get("/layers/{job_id}")
async def get_cad_layers(
    job_id: str,
    db: AsyncSession = Depends(get_db),
):
    """
    Get list of layers from CAD file.
    
    Args:
        job_id: Job ID from upload
        db: Database session
        
    Returns:
        List of layer names
    """
    try:
        import ezdxf
        
        from sqlalchemy import select
        
        result = await db.execute(
            select(ReferenceDocument).where(ReferenceDocument.job_id == job_id)
        )
        document = result.scalar_one_or_none()
        
        if not document:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Document not found: {job_id}",
            )
        
        file_path = Path(document.original_path)
        if not file_path.exists():
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="CAD file not found on disk",
            )
        
        # Convert DWG to DXF if needed
        dxf_path = file_path
        if file_path.suffix.lower() == ".dwg":
            # For DWG files, we'll try to read directly or use OCR
            # Full conversion would require ODA File Converter
            raise HTTPException(
                status_code=status.HTTP_501_NOT_IMPLEMENTED,
                detail="DWG layer extraction requires ODA File Converter. Use DXF for full features.",
            )
        
        # Read DXF and get layers
        doc = ezdxf.readfile(dxf_path)
        layers = [layer.dxf.name for layer in doc.layers]
        
        return {
            "job_id": job_id,
            "document_id": document.id,
            "layers": layers,
            "total_layers": len(layers),
        }
    
    except HTTPException:
        raise
    except ImportError:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="ezdxf library not installed",
        )
    except Exception as e:
        logger.error(f"CAD layer extraction failed: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Layer extraction failed: {str(e)}",
        )
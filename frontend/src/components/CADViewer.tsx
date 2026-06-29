import { useRef, useEffect, useState, useCallback } from 'react';

interface CADViewerProps {
  file: File | null;
  onFileLoad?: (file: File) => void;
  onExport?: (html: Blob) => void;
  className?: string;
}

// Types for mlightcad CADSimpleViewer
interface CADSimpleViewer {
  openFile(file: File): Promise<void>;
  zoomToFit(): void;
  exportHTML(): Promise<string>;
  getLayers(): Array<{ name: string; visible: boolean }>;
  setLayerVisible(name: string, visible: boolean): void;
  destroy(): void;
}

export default function CADViewer({ file, onFileLoad, onExport, className = '' }: CADViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<CADSimpleViewer | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [layers, setLayers] = useState<Array<{ name: string; visible: boolean }>>([]);
  const [isMeasuring, setIsMeasuring] = useState(false);
  const [viewerReady, setViewerReady] = useState(false);

  // Check if file is CAD format
  const isCADFile = useCallback((f: File | null): boolean => {
    if (!f) return false;
    const ext = f.name.toLowerCase().split('.').pop();
    return ext === 'dwg' || ext === 'dxf';
  }, []);

  // Initialize CADSimpleViewer
  useEffect(() => {
    if (!containerRef.current) return;

    const initViewer = async () => {
      try {
        // Dynamic import of CADSimpleViewer from mlightcad
        const module = await import('@mlightcad/cad-simple-viewer');
        const CADApp = module.CADApp;
        
        if (!CADApp || !containerRef.current) {
          throw new Error('Failed to load CADSimpleViewer');
        }

        // Create viewer instance
        const viewer = new CADApp({
          container: containerRef.current,
          backgroundColor: '#ffffff',
          showGrid: true,
          showToolbar: true,
        });

        viewerRef.current = viewer as unknown as CADSimpleViewer;
        setViewerReady(true);
        
        console.log('CADSimpleViewer initialized');
      } catch (err) {
        console.error('Failed to initialize CAD viewer:', err);
        setError('Failed to initialize CAD viewer. Using fallback display.');
        // Still allow file display even without full viewer
        setViewerReady(true);
      }
    };

    initViewer();

    return () => {
      viewerRef.current?.destroy();
      viewerRef.current = null;
    };
  }, []);

  // Load file when provided
  useEffect(() => {
    if (!file || !isCADFile(file) || !viewerRef.current) return;

    const loadFile = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        await viewerRef.current!.openFile(file);
        
        // Get layers after loading
        const viewerLayers = viewerRef.current!.getLayers();
        setLayers(viewerLayers);
        
        // Zoom to fit
        viewerRef.current!.zoomToFit();
        
        onFileLoad?.(file);
      } catch (err) {
        console.error('Failed to load CAD file:', err);
        setError(err instanceof Error ? err.message : 'Failed to load CAD file');
      } finally {
        setIsLoading(false);
      }
    };

    loadFile();
  }, [file, isCADFile, onFileLoad]);

  const handleZoomToFit = useCallback(() => {
    viewerRef.current?.zoomToFit();
  }, []);

  const handleToggleMeasurement = useCallback(() => {
    // Measurement would require additional toolbar activation
    setIsMeasuring(!isMeasuring);
    console.log('Measurement mode:', !isMeasuring ? 'enabled' : 'disabled');
  }, [isMeasuring]);

  const handleExportHTML = useCallback(async () => {
    if (!viewerRef.current || !file) return;
    
    try {
      const htmlContent = await viewerRef.current.exportHTML();
      const blob = new Blob([htmlContent], { type: 'text/html' });
      
      // Trigger download
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${file.name.replace(/\.[^/.]+$/, '')}_export.html`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      onExport?.(blob);
    } catch (err) {
      console.error('Failed to export HTML:', err);
      setError('Failed to export HTML');
    }
  }, [file, onExport]);

  const handleToggleLayer = useCallback((layerName: string, visible: boolean) => {
    viewerRef.current?.setLayerVisible(layerName, visible);
    setLayers(prev => prev.map(l => 
      l.name === layerName ? { ...l, visible } : l
    ));
  }, []);

  return (
    <div className={`cad-viewer-container ${className}`} style={{ border: '1px solid #ccc', borderRadius: '8px', padding: '1rem' }}>
      <div className="cad-viewer-toolbar" style={{ marginBottom: '1rem', display: 'flex', gap: '0.5rem' }}>
        <button 
          onClick={handleZoomToFit} 
          disabled={!file || isLoading || !viewerReady} 
          title="Zoom to Fit"
          style={{ padding: '0.5rem 1rem', cursor: 'pointer' }}
        >
          🔲 Fit
        </button>
        <button 
          onClick={handleToggleMeasurement} 
          disabled={!file || isLoading || !viewerReady} 
          title="Measure Distance"
          style={{ padding: '0.5rem 1rem', cursor: 'pointer' }}
        >
          📏 {isMeasuring ? 'Measuring' : 'Measure'}
        </button>
        <button 
          onClick={handleExportHTML} 
          disabled={!file || isLoading || !viewerReady} 
          title="Export to HTML"
          style={{ padding: '0.5rem 1rem', cursor: 'pointer' }}
        >
          💾 Export
        </button>
      </div>
      
      <div className="cad-viewer-viewport" ref={containerRef} style={{ minHeight: '400px', background: '#f5f5f5', position: 'relative' }}>
        {isLoading && (
          <div className="cad-viewer-loading" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '400px', position: 'absolute', top: 0, left: 0, right: 0 }}>
            <span>Loading CAD file...</span>
          </div>
        )}
        {error && (
          <div className="cad-viewer-error" style={{ color: 'red', padding: '1rem', position: 'absolute', top: 0, left: 0, right: 0 }}>
            <span>⚠️ {error}</span>
          </div>
        )}
        {!file && !isLoading && !error && (
          <div className="cad-viewer-placeholder" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '400px', color: '#666' }}>
            <span>📄 Upload a DWG or DXF file to view it here</span>
          </div>
        )}
      </div>
      
      {layers.length > 0 && (
        <div className="cad-viewer-layers" style={{ marginTop: '1rem' }}>
          <h4>Layers ({layers.length})</h4>
          <ul style={{ listStyle: 'none', padding: 0, maxHeight: '150px', overflowY: 'auto' }}>
            {layers.map((layer) => (
              <li key={layer.name}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.25rem 0' }}>
                  <input
                    type="checkbox"
                    checked={layer.visible}
                    onChange={(e) => handleToggleLayer(layer.name, e.target.checked)}
                  />
                  {layer.name}
                </label>
              </li>
            ))}
          </ul>
        </div>
      )}
      
      {file && viewerReady && !isLoading && (
        <div style={{ marginTop: '1rem', fontSize: '0.875rem', color: '#666' }}>
          <strong>{file.name}</strong> - {(file.size / 1024).toFixed(2)} KB
        </div>
      )}
    </div>
  );
}
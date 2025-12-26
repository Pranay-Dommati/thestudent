import { useEffect, useRef, useState } from 'react';
import { getDocument, GlobalWorkerOptions } from 'pdfjs-dist';
// Vite resolves the worker as an asset URL; the package provides only .js builds
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.min.js?url';

// Configure worker
GlobalWorkerOptions.workerSrc = pdfjsWorker;

// Render first page of the PDF into a canvas that fills the container.
export default function PDFCanvasViewer({ url, className = '' }) {
  const containerRef = useRef(null);
  const canvasRef = useRef(null);
  const [status, setStatus] = useState('loading'); // loading | ready | error
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    let pdf = null;
    let page = null;
    const render = async () => {
      try {
        setStatus('loading');
        setError('');
        pdf = await getDocument({ url, withCredentials: false }).promise;
        if (cancelled) return;
        page = await pdf.getPage(1);
        if (cancelled) return;

        const container = containerRef.current;
        const canvas = canvasRef.current;
        if (!container || !canvas) return;

  const viewport = page.getViewport({ scale: 1 });
  // Fit to container width, maintain aspect ratio
  const targetWidth = Math.max(1, container.clientWidth);
  const scale = targetWidth / viewport.width;
  const dpr = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1;
  const scaled = page.getViewport({ scale: scale * dpr });

  const cssWidth = Math.floor(viewport.width * scale);
  const cssHeight = Math.floor(viewport.height * scale);

  const ctx = canvas.getContext('2d');
  canvas.width = Math.floor(scaled.width);
  canvas.height = Math.floor(scaled.height);
  canvas.style.width = `${cssWidth}px`;
  canvas.style.height = `${cssHeight}px`;
  ctx.setTransform(1, 0, 0, 1, 0, 0); // reset any transforms

  await page.render({ canvasContext: ctx, viewport: scaled, intent: 'display' }).promise;
        if (cancelled) return;
        setStatus('ready');
      } catch (e) {
        if (cancelled) return;
        console.error('PDF render error', e);
        setError('Unable to render preview');
        setStatus('error');
      }
    };

    render();

    const handleResize = () => {
      // re-render on resize for proper fit
      if (status === 'ready') {
        render();
      }
    };
    window.addEventListener('resize', handleResize);
    return () => {
      cancelled = true;
      window.removeEventListener('resize', handleResize);
      if (page && page.cleanup) page.cleanup();
      if (pdf && pdf.cleanup) pdf.cleanup();
    };
  }, [url]);

  return (
    <div ref={containerRef} className={`relative w-full bg-white ${className}`}>
      {status === 'loading' && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-50">
          <div className="animate-spin w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full"></div>
        </div>
      )}
      {status === 'error' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-4 bg-gray-50">
          <p className="text-gray-700 mb-2">{error}</p>
          <a href={url} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">Open in new tab</a>
        </div>
      )}
      <canvas ref={canvasRef} className="block mx-auto" />
    </div>
  );
}

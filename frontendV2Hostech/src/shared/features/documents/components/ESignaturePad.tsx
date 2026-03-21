// @ts-nocheck
import React, { useRef, useState, useEffect } from 'react';
import { PenTool, Trash2, CheckCircle2, RotateCcw } from 'lucide-react';

interface ESignaturePadProps {
  onSave?: (signatureData: string) => void;
  onClear?: () => void;
}

export default function ESignaturePad({ onSave, onClear }: ESignaturePadProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [isEmpty, setIsEmpty] = useState(true);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set high precision for canvas
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);
    canvas.style.width = `${rect.width}px`;
    canvas.style.height = `${rect.height}px`;

    ctx.strokeStyle = '#1e293b'; // slate-800
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
  }, []);

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    setIsDrawing(true);
    setIsEmpty(false);
    draw(e);
  };

  const stopDrawing = () => {
    setIsDrawing(false);
    const canvas = canvasRef.current;
    if (canvas && onSave) {
      onSave(canvas.toDataURL());
    }
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    const rect = canvas.getBoundingClientRect();
    let x, y;

    if ('touches' in e) {
      x = e.touches[0].clientX - rect.left;
      y = e.touches[0].clientY - rect.top;
    } else {
      x = e.clientX - rect.left;
      y = e.clientY - rect.top;
    }

    if (!ctx.canvas.dataset.initialMove) {
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.canvas.dataset.initialMove = 'true';
    } else {
      ctx.lineTo(x, y);
      ctx.stroke();
    }
  };

  const handleClear = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (canvas && ctx) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      delete ctx.canvas.dataset.initialMove;
      setIsEmpty(true);
      if (onClear) onClear();
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between px-2">
        <div className="flex items-center gap-2">
          <PenTool className="w-4 h-4 text-slate-400" />
          <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Digital Signature</span>
        </div>
        <button 
          onClick={handleClear}
          className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-xl transition-all"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
      </div>

      <div className="relative group">
        <canvas
          ref={canvasRef}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseOut={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
          className="w-full h-48 bg-slate-50 dark:bg-slate-800/50 border-2 border-dashed border-slate-200 dark:border-slate-600 rounded-4xl cursor-crosshair group-hover:bg-white dark:group-hover:bg-slate-800 group-hover:border-indigo-200 dark:group-hover:border-indigo-700 transition-all touch-none"
        />
        
        {isEmpty && (
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none opacity-20 group-hover:opacity-10 transition-opacity">
            <span className="text-slate-400 font-bold uppercase tracking-tighter text-4xl italic">Sign Here</span>
            <span className="text-slate-400 text-xs font-medium">Use mouse or finger to draw signature</span>
          </div>
        )}
      </div>

      <div className="flex items-center gap-2 p-3 bg-slate-900 dark:bg-slate-800 rounded-2xl">
        <div className="flex-1">
          <div className="flex gap-2 text-xs font-black uppercase tracking-widest text-slate-500">
            <span>IP: 192.168.1.1</span>
            <span>OS: Windows</span>
            <span>Timestamp: {new Date().toISOString().split('T')[0]}</span>
          </div>
        </div>
        {!isEmpty && (
          <div className="flex items-center gap-1.5 px-3 py-1 bg-emerald-500/10 text-emerald-500 rounded-full">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span className="text-xs font-black uppercase tracking-widest">Authorized</span>
          </div>
        )}
      </div>
    </div>
  );
}

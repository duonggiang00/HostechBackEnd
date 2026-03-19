// @ts-nocheck
import { useState, useCallback, useRef } from 'react';
import { UploadCloud, X, File, Image as ImageIcon, Loader2 } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

interface MediaDropzoneProps {
  onDrop: (files: File[]) => void;
  maxFiles?: number;
  maxSize?: number; // bytes
  accept?: string;
  isUploading?: boolean;
}

export default function MediaDropzone({
  onDrop,
  maxFiles = 5,
  maxSize = 10 * 1024 * 1024, // 10MB
  accept = "image/*,video/*",
  isUploading = false
}: MediaDropzoneProps) {
  const [isDragActive, setIsDragActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isDragActive) setIsDragActive(true);
  }, [isDragActive]);

  const validateFiles = (files: File[]) => {
    if (files.length > maxFiles) {
      setError(`You can only upload up to ${maxFiles} files at once.`);
      return false;
    }
    
    for (const file of files) {
      if (file.size > maxSize) {
        setError(`File ${file.name} exceeds the maximum size of ${maxSize / (1024 * 1024)}MB.`);
        return false;
      }
    }
    
    setError(null);
    return true;
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const files = Array.from(e.dataTransfer.files);
      if (validateFiles(files)) {
        onDrop(files);
      }
    }
  }, [onDrop, maxFiles, maxSize]);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const files = Array.from(e.target.files);
      if (validateFiles(files)) {
        onDrop(files);
      }
      // Reset input value so same files can be selected again if needed
      if (inputRef.current) inputRef.current.value = '';
    }
  }, [onDrop, maxFiles, maxSize]);

  return (
    <div className="w-full">
      <div
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={twMerge(
          clsx(
            "relative flex flex-col items-center justify-center w-full h-48 px-4 py-6 border-2 border-dashed rounded-[2rem] transition-all cursor-pointer group hover:bg-slate-50",
            {
              "border-indigo-500 bg-indigo-50/50": isDragActive,
              "border-slate-200 bg-white": !isDragActive,
              "opacity-50 pointer-events-none": isUploading
            }
          )
        )}
      >
        <input
          ref={inputRef}
          type="file"
          multiple={maxFiles > 1}
          accept={accept}
          onChange={handleChange}
          className="hidden"
          disabled={isUploading}
        />
        
        <div className="flex flex-col items-center justify-center gap-3">
          <div className={twMerge(clsx(
            "p-4 rounded-full transition-colors",
            {
              "bg-indigo-100 text-indigo-600": isDragActive,
              "bg-slate-50 text-slate-400 group-hover:bg-indigo-50 group-hover:text-indigo-500": !isDragActive
            }
          ))}>
            {isUploading ? (
              <Loader2 className="w-8 h-8 animate-spin" />
            ) : (
              <UploadCloud className="w-8 h-8" />
            )}
          </div>
          
          <div className="text-center space-y-1">
            <p className="text-sm font-bold text-slate-700">
              {isUploading ? "Uploading..." : "Click or drag files to upload"}
            </p>
            <p className="text-xs text-slate-500 font-medium max-w-xs mx-auto">
              PNG, JPG, or MP4 up to {maxSize / (1024 * 1024)}MB. Max {maxFiles} files.
            </p>
          </div>
        </div>
      </div>

      {error && (
        <div className="mt-3 text-sm font-bold text-rose-500 flex items-center justify-center gap-1">
          <X className="w-4 h-4" />
          {error}
        </div>
      )}
    </div>
  );
}


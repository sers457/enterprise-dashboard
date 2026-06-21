import { useState, useRef, useCallback } from 'react';
import { Upload, File, X, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FileUploadProps {
  accept?: string;
  multiple?: boolean;
  maxSize?: number;
  onUpload: (files: File[]) => void;
  className?: string;
}

interface UploadedFile {
  file: File;
  progress: number;
  status: 'pending' | 'uploading' | 'done' | 'error';
}

export function FileUpload({ accept, multiple = false, maxSize = 5 * 1024 * 1024, onUpload, className }: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setIsDragging(true);
    } else if (e.type === 'dragleave') {
      setIsDragging(false);
    }
  }, []);

  const processFiles = useCallback((fileList: FileList) => {
    const newFiles: UploadedFile[] = Array.from(fileList)
      .filter((f) => {
        if (maxSize && f.size > maxSize) {
          return false;
        }
        return true;
      })
      .map((file) => ({
        file,
        progress: 0,
        status: 'pending' as const,
      }));
    setFiles((prev) => [...prev, ...newFiles]);
    onUpload(newFiles.map((f) => f.file));
  }, [maxSize, onUpload]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files?.length) {
      processFiles(e.dataTransfer.files);
    }
  }, [processFiles]);

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className={cn('space-y-3', className)}>
      <div
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={cn(
          'relative border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all duration-200',
          isDragging
            ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/10'
            : 'border-neutral-300 dark:border-neutral-700 hover:border-neutral-400 dark:hover:border-neutral-600 hover:bg-neutral-50 dark:hover:bg-dark-800/50'
        )}
      >
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          onChange={(e) => e.target.files && processFiles(e.target.files)}
          className="hidden"
        />
        <div className="flex flex-col items-center gap-2">
          <div className="w-12 h-12 rounded-xl bg-neutral-100 dark:bg-dark-800 flex items-center justify-center">
            <Upload className={cn('h-6 w-6', isDragging ? 'text-primary-500' : 'text-neutral-400')} />
          </div>
          <p className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
            {isDragging ? 'Drop files here' : 'Drag & drop files or click to browse'}
          </p>
          <p className="text-xs text-neutral-400">
            Max file size: {formatSize(maxSize)}
          </p>
        </div>
      </div>

      {files.length > 0 && (
        <div className="space-y-2">
          {files.map((f, i) => (
            <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-neutral-50 dark:bg-dark-800/50">
              <File className="h-5 w-5 text-neutral-400" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-neutral-900 dark:text-white truncate">{f.file.name}</p>
                <p className="text-xs text-neutral-400">{formatSize(f.file.size)}</p>
              </div>
              {f.status === 'done' ? (
                <CheckCircle className="h-5 w-5 text-emerald-500" />
              ) : (
                <button onClick={() => removeFile(i)} className="p-1 rounded-lg hover:bg-neutral-200 dark:hover:bg-dark-700">
                  <X className="h-4 w-4 text-neutral-400" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

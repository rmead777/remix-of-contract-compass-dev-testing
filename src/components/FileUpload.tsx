import { useCallback, useState } from "react";
import { Upload, FileText, X, AlertCircle, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface FileUploadProps {
  onFilesSelected: (files: File[]) => void;
  isProcessing?: boolean;
}

export function FileUpload({ onFilesSelected, isProcessing }: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = Array.from(e.dataTransfer.files).filter(
      file => file.type === 'application/pdf' || 
              file.type === 'application/msword' ||
              file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    );
    
    if (files.length > 0) {
      setSelectedFiles(prev => [...prev, ...files]);
    }
  }, []);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      setSelectedFiles(prev => [...prev, ...files]);
    }
    e.target.value = '';
  }, []);

  const removeFile = useCallback((index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  }, []);

  const handleUpload = useCallback(() => {
    if (selectedFiles.length > 0) {
      onFilesSelected(selectedFiles);
      setSelectedFiles([]);
    }
  }, [selectedFiles, onFilesSelected]);

  return (
    <div className="space-y-4">
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={cn(
          "relative flex min-h-[180px] cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed p-6 transition-all duration-200",
          isDragging 
            ? "border-secondary bg-secondary/5 scale-[1.01]" 
            : "border-border bg-muted/30 hover:border-secondary/50 hover:bg-muted/50",
          isProcessing && "pointer-events-none opacity-50"
        )}
      >
        <input
          type="file"
          onChange={handleFileInput}
          multiple
          accept=".pdf,.doc,.docx"
          className="absolute inset-0 cursor-pointer opacity-0"
          disabled={isProcessing}
        />
        <div className={cn(
          "flex h-14 w-14 items-center justify-center rounded-full transition-colors",
          isDragging ? "bg-secondary text-secondary-foreground" : "bg-primary/10 text-primary"
        )}>
          <Upload className="h-6 w-6" />
        </div>
        <p className="mt-4 text-center font-medium text-foreground">
          {isDragging ? "Drop your contracts here" : "Drag & drop contracts"}
        </p>
        <p className="mt-1 text-center text-sm text-muted-foreground">
          or click to browse • PDF, DOC, DOCX
        </p>
      </div>

      {selectedFiles.length > 0 && (
        <div className="animate-fade-in space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-foreground">
              {selectedFiles.length} file{selectedFiles.length !== 1 ? 's' : ''} selected
            </p>
            <button
              onClick={handleUpload}
              disabled={isProcessing}
              className="rounded-lg bg-secondary px-4 py-2 text-sm font-medium text-secondary-foreground transition-all hover:bg-secondary/90 hover:shadow-glow disabled:opacity-50"
            >
              Analyze Contracts
            </button>
          </div>
          <div className="max-h-[200px] space-y-2 overflow-y-auto scrollbar-thin rounded-lg border border-border bg-card p-2">
            {selectedFiles.map((file, index) => (
              <div
                key={`${file.name}-${index}`}
                className="flex items-center gap-3 rounded-md bg-muted/50 p-2 animate-scale-in"
              >
                <FileText className="h-4 w-4 text-primary" />
                <span className="flex-1 truncate text-sm text-foreground">
                  {file.name}
                </span>
                <span className="text-xs text-muted-foreground">
                  {(file.size / 1024).toFixed(0)} KB
                </span>
                <button
                  onClick={() => removeFile(index)}
                  className="rounded p-1 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

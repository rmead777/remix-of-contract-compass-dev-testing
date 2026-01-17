import { X, Sparkles, Plus, Loader2 } from "lucide-react";
import { NewTermSuggestion } from "@/types/contract";

interface NewTermModalProps {
  isOpen: boolean;
  onClose: () => void;
  suggestion: NewTermSuggestion | null;
  onConfirm: () => void;
  onDismiss: () => void;
  isReanalyzing?: boolean;
}

export function NewTermModal({ 
  isOpen, 
  onClose, 
  suggestion, 
  onConfirm, 
  onDismiss,
  isReanalyzing 
}: NewTermModalProps) {
  if (!isOpen || !suggestion) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/50 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <div 
        className="relative mx-4 w-full max-w-lg animate-scale-in rounded-xl bg-card p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {isReanalyzing ? (
          <div className="flex flex-col items-center py-8">
            <Loader2 className="h-10 w-10 animate-spin text-secondary" />
            <p className="mt-4 text-lg font-medium text-foreground">
              Re-analyzing contracts...
            </p>
            <p className="mt-2 text-sm text-muted-foreground text-center">
              Extracting "{suggestion.termLabel}" from all previous contracts
            </p>
          </div>
        ) : (
          <>
            <button
              onClick={onClose}
              className="absolute right-4 top-4 rounded-lg p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-secondary/10">
                <Sparkles className="h-6 w-6 text-secondary" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-foreground font-serif">
                  New Term Discovered
                </h3>
                <p className="text-sm text-muted-foreground">
                  in {suggestion.foundInContract}
                </p>
              </div>
            </div>

            <div className="mt-6 rounded-lg border border-secondary/30 bg-secondary/5 p-4">
              <div className="flex items-center justify-between">
                <span className="font-medium text-foreground">
                  {suggestion.termLabel}
                </span>
                <span className="rounded-full bg-secondary/20 px-2 py-0.5 text-xs font-medium text-secondary">
                  New Column
                </span>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">
                {suggestion.description}
              </p>
              <div className="mt-3 rounded bg-muted/50 p-2">
                <span className="text-xs font-medium text-muted-foreground">Sample value:</span>
                <p className="mt-1 text-sm text-foreground">"{suggestion.sampleValue}"</p>
              </div>
            </div>

            <p className="mt-4 text-sm text-muted-foreground">
              Adding this column will re-analyze all {" "}
              <span className="font-medium text-foreground">previous contracts</span> to extract this term.
            </p>

            <div className="mt-6 flex gap-3">
              <button
                onClick={onDismiss}
                className="flex-1 rounded-lg border border-border py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                Skip This Time
              </button>
              <button
                onClick={onConfirm}
                className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-secondary py-2.5 text-sm font-medium text-secondary-foreground transition-all hover:bg-secondary/90 hover:shadow-glow"
              >
                <Plus className="h-4 w-4" />
                Add Column
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

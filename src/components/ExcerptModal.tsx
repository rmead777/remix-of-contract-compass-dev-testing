import { X, FileText, Quote } from "lucide-react";
import { cn } from "@/lib/utils";

interface ExcerptModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: {
    term: string;
    value: string;
    excerpt: string;
    contractName: string;
  } | null;
}

export function ExcerptModal({ isOpen, onClose, data }: ExcerptModalProps) {
  if (!isOpen || !data) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/50 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <div 
        className="relative mx-4 w-full max-w-2xl animate-scale-in rounded-xl bg-card p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-lg p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="mb-6">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <FileText className="h-4 w-4" />
            <span>{data.contractName}</span>
          </div>
          <h3 className="mt-2 text-xl font-semibold text-foreground font-serif">
            {data.term}
          </h3>
          <div className="mt-2 inline-flex items-center gap-2 rounded-full bg-secondary/10 px-3 py-1 text-sm font-medium text-secondary">
            {data.value}
          </div>
        </div>

        <div className="rounded-lg bg-muted/50 p-4">
          <div className="mb-2 flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
            <Quote className="h-3 w-3" />
            Contract Excerpt
          </div>
          <p className="text-sm leading-relaxed text-foreground">
            {data.excerpt}
          </p>
        </div>

        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

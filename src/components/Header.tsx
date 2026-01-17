import { FileText, Settings } from "lucide-react";

export function Header() {
  return (
    <header className="gradient-primary border-b border-primary/20">
      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary">
              <FileText className="h-5 w-5 text-secondary-foreground" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-primary-foreground font-serif">
                Contract Analyzer
              </h1>
              <p className="text-xs text-primary-foreground/70">
                Employment contract intelligence
              </p>
            </div>
          </div>
          <button className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-primary-foreground/80 transition-colors hover:bg-primary-foreground/10">
            <Settings className="h-4 w-4" />
            <span className="hidden sm:inline">Settings</span>
          </button>
        </div>
      </div>
    </header>
  );
}

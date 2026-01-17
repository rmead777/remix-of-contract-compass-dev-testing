import { useState, useMemo } from "react";
import { 
  ChevronUp, 
  ChevronDown, 
  Search, 
  Download, 
  Columns, 
  Eye,
  Loader2,
  AlertCircle,
  CheckCircle2
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Contract, TableColumn } from "@/types/contract";
import { ExcerptModal } from "./ExcerptModal";

interface ContractTableProps {
  contracts: Contract[];
  columns: TableColumn[];
  onColumnToggle?: (columnId: string) => void;
  isLoading?: boolean;
}

type SortDirection = 'asc' | 'desc' | null;

export function ContractTable({ 
  contracts, 
  columns,
  onColumnToggle,
  isLoading 
}: ContractTableProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);
  const [showColumnSelector, setShowColumnSelector] = useState(false);
  const [selectedExcerpt, setSelectedExcerpt] = useState<{
    term: string;
    value: string;
    excerpt: string;
    contractName: string;
  } | null>(null);

  const visibleColumns = columns.filter(col => col.isDefault).sort((a, b) => a.order - b.order);

  const filteredContracts = useMemo(() => {
    let result = contracts;

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(contract => {
        if (contract.fileName.toLowerCase().includes(query)) return true;
        return Object.values(contract.terms).some(
          term => term.value?.toLowerCase().includes(query)
        );
      });
    }

    if (sortColumn && sortDirection) {
      result = [...result].sort((a, b) => {
        const aVal = a.terms[sortColumn]?.value || '';
        const bVal = b.terms[sortColumn]?.value || '';
        const comparison = aVal.localeCompare(bVal);
        return sortDirection === 'asc' ? comparison : -comparison;
      });
    }

    return result;
  }, [contracts, searchQuery, sortColumn, sortDirection]);

  const handleSort = (columnId: string) => {
    if (sortColumn === columnId) {
      if (sortDirection === 'asc') setSortDirection('desc');
      else if (sortDirection === 'desc') {
        setSortColumn(null);
        setSortDirection(null);
      }
    } else {
      setSortColumn(columnId);
      setSortDirection('asc');
    }
  };

  const handleExport = () => {
    const headers = ['File Name', ...visibleColumns.map(col => col.label)];
    const rows = filteredContracts.map(contract => [
      contract.fileName,
      ...visibleColumns.map(col => contract.terms[col.id]?.value || 'N/A')
    ]);
    
    const csv = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `contracts-export-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleCellClick = (contract: Contract, column: TableColumn) => {
    const term = contract.terms[column.id];
    if (term?.excerpt) {
      setSelectedExcerpt({
        term: column.label,
        value: term.value || 'N/A',
        excerpt: term.excerpt,
        contractName: contract.fileName,
      });
    }
  };

  const getStatusIcon = (status: Contract['status']) => {
    switch (status) {
      case 'processing':
        return <Loader2 className="h-4 w-4 animate-spin text-secondary" />;
      case 'completed':
        return <CheckCircle2 className="h-4 w-4 text-success" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-destructive" />;
      default:
        return null;
    }
  };

  if (contracts.length === 0 && !isLoading) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-border bg-muted/20 py-16">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
          <Search className="h-7 w-7 text-muted-foreground" />
        </div>
        <p className="mt-4 text-lg font-medium text-foreground">No contracts yet</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Upload your first contract to get started
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search contracts..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-lg border border-input bg-card py-2 pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:border-secondary focus:outline-none focus:ring-1 focus:ring-secondary"
          />
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowColumnSelector(!showColumnSelector)}
            className="flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted"
          >
            <Columns className="h-4 w-4" />
            Columns
          </button>
          <button
            onClick={handleExport}
            className="flex items-center gap-2 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            <Download className="h-4 w-4" />
            Export CSV
          </button>
        </div>
      </div>

      {/* Column Selector Dropdown */}
      {showColumnSelector && (
        <div className="animate-scale-in rounded-lg border border-border bg-card p-4 shadow-lg">
          <p className="mb-3 text-sm font-medium text-foreground">Toggle Columns</p>
          <div className="flex flex-wrap gap-2">
            {columns.map(column => (
              <label
                key={column.id}
                className={cn(
                  "flex cursor-pointer items-center gap-2 rounded-md border px-3 py-1.5 text-sm transition-colors",
                  column.isDefault
                    ? "border-secondary bg-secondary/10 text-secondary-foreground"
                    : "border-border text-muted-foreground hover:border-secondary/50"
                )}
              >
                <input
                  type="checkbox"
                  checked={column.isDefault}
                  onChange={() => onColumnToggle?.(column.id)}
                  className="sr-only"
                />
                {column.label}
              </label>
            ))}
          </div>
        </div>
      )}

      {/* Table */}
      <div className="card-elevated overflow-hidden">
        <div className="overflow-x-auto scrollbar-thin">
          <table className="w-full min-w-[800px]">
            <thead>
              <tr className="bg-table-header">
                <th className="sticky left-0 z-10 bg-table-header px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-table-header-foreground">
                  <div className="flex items-center gap-2">
                    Status
                  </div>
                </th>
                <th className="sticky left-[72px] z-10 bg-table-header px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-table-header-foreground">
                  File Name
                </th>
                {visibleColumns.map(column => (
                  <th
                    key={column.id}
                    onClick={() => handleSort(column.id)}
                    className="cursor-pointer px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-table-header-foreground transition-colors hover:bg-primary/20"
                  >
                    <div className="flex items-center gap-1">
                      {column.label}
                      {sortColumn === column.id && (
                        sortDirection === 'asc' 
                          ? <ChevronUp className="h-3 w-3" />
                          : <ChevronDown className="h-3 w-3" />
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-table-border">
              {isLoading && (
                <tr>
                  <td colSpan={visibleColumns.length + 2} className="px-4 py-8 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <Loader2 className="h-6 w-6 animate-spin text-secondary" />
                      <span className="text-sm text-muted-foreground">Analyzing contracts...</span>
                    </div>
                  </td>
                </tr>
              )}
              {!isLoading && filteredContracts.map((contract) => (
                <tr
                  key={contract.id}
                  className="transition-colors hover:bg-table-row-hover"
                >
                  <td className="sticky left-0 z-10 bg-card px-4 py-3">
                    {getStatusIcon(contract.status)}
                  </td>
                  <td className="sticky left-[72px] z-10 bg-card px-4 py-3">
                    <div className="flex flex-col">
                      <span className="font-medium text-foreground truncate max-w-[200px]">
                        {contract.fileName}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {contract.uploadedAt.toLocaleDateString()}
                      </span>
                    </div>
                  </td>
                  {visibleColumns.map(column => {
                    const term = contract.terms[column.id];
                    const hasValue = term?.value && term.value !== 'N/A';
                    const hasExcerpt = !!term?.excerpt;
                    
                    return (
                      <td
                        key={column.id}
                        className="px-4 py-3 text-sm"
                      >
                        {hasExcerpt ? (
                          <button
                            onClick={() => handleCellClick(contract, column)}
                            className={cn(
                              "group flex items-center gap-2 text-left transition-colors",
                              "text-primary hover:text-primary/80 hover:underline",
                              "focus:outline-none focus:ring-2 focus:ring-primary/50 focus:ring-offset-2 rounded"
                            )}
                          >
                            <span className={cn(
                              "truncate max-w-[200px]",
                              hasValue ? "" : "italic opacity-70"
                            )}>
                              {term?.value || 'N/A'}
                            </span>
                            <Eye className="h-3.5 w-3.5 flex-shrink-0 opacity-50 group-hover:opacity-100 transition-opacity" />
                          </button>
                        ) : (
                          <span className={cn(
                            "truncate max-w-[200px] block",
                            hasValue ? "text-foreground" : "text-muted-foreground italic"
                          )}>
                            {term?.value || 'N/A'}
                          </span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Results count */}
      <p className="text-sm text-muted-foreground">
        Showing {filteredContracts.length} of {contracts.length} contracts
      </p>

      {/* Excerpt Modal */}
      <ExcerptModal
        isOpen={!!selectedExcerpt}
        onClose={() => setSelectedExcerpt(null)}
        data={selectedExcerpt}
      />
    </div>
  );
}

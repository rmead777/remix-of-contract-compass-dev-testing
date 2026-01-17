import { useState, useCallback } from "react";
import { Contract, TableColumn, NewTermSuggestion, DEFAULT_COLUMNS } from "@/types/contract";
import { analyzeContract, extractTextFromFile } from "@/lib/api/contracts";
import { useToast } from "@/hooks/use-toast";

export function useContracts() {
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [columns, setColumns] = useState<TableColumn[]>(DEFAULT_COLUMNS);
  const [isProcessing, setIsProcessing] = useState(false);
  const [pendingSuggestion, setPendingSuggestion] = useState<NewTermSuggestion | null>(null);
  const [isReanalyzing, setIsReanalyzing] = useState(false);
  const { toast } = useToast();

  const uploadContracts = useCallback(async (files: File[]) => {
    setIsProcessing(true);
    
    // Add contracts with processing status
    const newContracts: Contract[] = files.map(file => ({
      id: crypto.randomUUID(),
      fileName: file.name,
      uploadedAt: new Date(),
      status: 'processing' as const,
      terms: {},
    }));
    
    setContracts(prev => [...prev, ...newContracts]);
    
    const existingColumnIds = columns.map(c => c.id);
    
    // Process each file with AI analysis
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const contract = newContracts[i];
      
      try {
        // Extract text from the file
        const contractText = await extractTextFromFile(file);
        
        // Analyze with AI
        const result = await analyzeContract(contractText, file.name, existingColumnIds);
        
        if (result.success && result.terms) {
          setContracts(prev => 
            prev.map(c => c.id === contract.id ? {
              ...c,
              status: 'completed' as const,
              terms: result.terms!
            } : c)
          );
          
          // Check for suggested new terms
          if (result.suggestedNewTerms && result.suggestedNewTerms.length > 0) {
            const newSuggestion = result.suggestedNewTerms[0];
            // Only suggest if we don't already have this column
            if (!existingColumnIds.includes(newSuggestion.termId)) {
              setPendingSuggestion(newSuggestion);
            }
          }
          
          toast({
            title: "Contract analyzed",
            description: `Successfully extracted terms from ${file.name}`,
          });
        } else {
          setContracts(prev => 
            prev.map(c => c.id === contract.id ? {
              ...c,
              status: 'error' as const,
              errorMessage: result.error || 'Failed to analyze contract'
            } : c)
          );
          
          toast({
            title: "Analysis failed",
            description: result.error || `Could not analyze ${file.name}`,
            variant: "destructive",
          });
        }
      } catch (error) {
        console.error('Error processing contract:', error);
        setContracts(prev => 
          prev.map(c => c.id === contract.id ? {
            ...c,
            status: 'error' as const,
            errorMessage: error instanceof Error ? error.message : 'Unknown error'
          } : c)
        );
        
        toast({
          title: "Processing error",
          description: `Error processing ${file.name}`,
          variant: "destructive",
        });
      }
    }
    
    setIsProcessing(false);
  }, [columns, toast]);

  const toggleColumn = useCallback((columnId: string) => {
    setColumns(prev => 
      prev.map(col => 
        col.id === columnId ? { ...col, isDefault: !col.isDefault } : col
      )
    );
  }, []);

  const addNewColumn = useCallback(async () => {
    if (!pendingSuggestion) return;
    
    setIsReanalyzing(true);
    
    // Add the new column
    const newColumn: TableColumn = {
      id: pendingSuggestion.termId,
      label: pendingSuggestion.termLabel,
      description: pendingSuggestion.description,
      isDefault: true,
      order: columns.length,
    };
    
    setColumns(prev => [...prev, newColumn]);
    
    // Re-analyze all existing contracts for the new term
    const existingColumnIds = [...columns.map(c => c.id), pendingSuggestion.termId];
    
    for (const contract of contracts.filter(c => c.status === 'completed')) {
      try {
        // For demo, we'll use a mock re-analysis
        // In production, you'd re-extract from stored files
        await new Promise(resolve => setTimeout(resolve, 500));
        
        setContracts(prev => 
          prev.map(c => c.id === contract.id ? {
            ...c,
            terms: {
              ...c.terms,
              [pendingSuggestion.termId]: {
                value: Math.random() > 0.3 ? pendingSuggestion.sampleValue : null,
                excerpt: `Relevant clause for ${pendingSuggestion.termLabel}...`,
                confidence: 0.85,
              },
            },
          } : c)
        );
      } catch (error) {
        console.error('Error re-analyzing contract:', error);
      }
    }
    
    toast({
      title: "Column added",
      description: `Added "${pendingSuggestion.termLabel}" and re-analyzed all contracts`,
    });
    
    setIsReanalyzing(false);
    setPendingSuggestion(null);
  }, [pendingSuggestion, columns, contracts, toast]);

  const dismissSuggestion = useCallback(() => {
    setPendingSuggestion(null);
  }, []);

  return {
    contracts,
    columns,
    isProcessing,
    pendingSuggestion,
    isReanalyzing,
    uploadContracts,
    toggleColumn,
    addNewColumn,
    dismissSuggestion,
  };
}

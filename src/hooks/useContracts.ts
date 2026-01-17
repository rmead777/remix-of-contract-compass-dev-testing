import { useState, useCallback, useEffect } from "react";
import { Contract, TableColumn, NewTermSuggestion, DEFAULT_COLUMNS } from "@/types/contract";
import { analyzeContract, extractTextFromFile } from "@/lib/api/contracts";
import { 
  uploadContractToStorage, 
  saveContractRecord, 
  updateContractAnalysis,
  fetchUserContracts,
  downloadContractFile,
  StoredContract 
} from "@/lib/api/storage";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

export function useContracts() {
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [columns, setColumns] = useState<TableColumn[]>(DEFAULT_COLUMNS);
  const [isProcessing, setIsProcessing] = useState(false);
  const [pendingSuggestion, setPendingSuggestion] = useState<NewTermSuggestion | null>(null);
  const [isReanalyzing, setIsReanalyzing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const { toast } = useToast();

  // Check auth state and load existing contracts
  useEffect(() => {
    const checkAuthAndLoadContracts = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUserId(user?.id || null);
      
      if (user) {
        const { contracts: storedContracts, error } = await fetchUserContracts();
        if (!error && storedContracts.length > 0) {
          const loadedContracts: Contract[] = storedContracts.map((sc: StoredContract) => ({
            id: sc.id,
            fileName: sc.file_name,
            uploadedAt: new Date(sc.created_at),
            status: 'completed' as const,
            terms: sc.analysis_data || {},
            filePath: sc.file_path,
          }));
          setContracts(loadedContracts);
        }
      }
      setIsLoading(false);
    };

    checkAuthAndLoadContracts();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      setUserId(session?.user?.id || null);
      if (event === 'SIGNED_IN' && session?.user) {
        const { contracts: storedContracts } = await fetchUserContracts();
        if (storedContracts.length > 0) {
          const loadedContracts: Contract[] = storedContracts.map((sc: StoredContract) => ({
            id: sc.id,
            fileName: sc.file_name,
            uploadedAt: new Date(sc.created_at),
            status: 'completed' as const,
            terms: sc.analysis_data || {},
            filePath: sc.file_path,
          }));
          setContracts(loadedContracts);
        }
      } else if (event === 'SIGNED_OUT') {
        setContracts([]);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const uploadContracts = useCallback(async (files: File[]) => {
    if (!userId) {
      toast({
        title: "Authentication required",
        description: "Please sign in to upload contracts",
        variant: "destructive",
      });
      return;
    }

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
        // Upload to storage
        const { filePath, error: uploadError } = await uploadContractToStorage(file, userId);
        
        if (uploadError) {
          throw new Error(`Upload failed: ${uploadError}`);
        }
        
        // Extract text from the file
        const contractText = await extractTextFromFile(file);
        
        // Analyze with AI
        const result = await analyzeContract(contractText, file.name, existingColumnIds);
        
        if (result.success && result.terms) {
          // Save to database
          const { id: dbId, error: dbError } = await saveContractRecord(
            userId,
            file.name,
            filePath,
            file.size,
            file.type,
            result.terms
          );
          
          if (dbError) {
            throw new Error(`Database save failed: ${dbError}`);
          }
          
          setContracts(prev => 
            prev.map(c => c.id === contract.id ? {
              ...c,
              id: dbId!, // Use the database ID
              status: 'completed' as const,
              terms: result.terms!,
              filePath,
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
  }, [columns, toast, userId]);

  const reanalyzeContract = useCallback(async (contractId: string) => {
    const contract = contracts.find(c => c.id === contractId);
    if (!contract || !contract.filePath) {
      toast({
        title: "Cannot re-analyze",
        description: "Contract file not found in storage",
        variant: "destructive",
      });
      return;
    }

    setContracts(prev => 
      prev.map(c => c.id === contractId ? { ...c, status: 'processing' as const } : c)
    );

    try {
      const { blob, error: downloadError } = await downloadContractFile(contract.filePath);
      
      if (downloadError || !blob) {
        throw new Error(`Download failed: ${downloadError}`);
      }

      const file = new File([blob], contract.fileName, { type: blob.type });
      const contractText = await extractTextFromFile(file);
      const existingColumnIds = columns.map(c => c.id);
      const result = await analyzeContract(contractText, contract.fileName, existingColumnIds);

      if (result.success && result.terms) {
        await updateContractAnalysis(contractId, result.terms);
        
        setContracts(prev => 
          prev.map(c => c.id === contractId ? {
            ...c,
            status: 'completed' as const,
            terms: result.terms!,
          } : c)
        );

        toast({
          title: "Re-analysis complete",
          description: `Updated analysis for ${contract.fileName}`,
        });
      } else {
        throw new Error(result.error || 'Analysis failed');
      }
    } catch (error) {
      console.error('Error re-analyzing contract:', error);
      setContracts(prev => 
        prev.map(c => c.id === contractId ? {
          ...c,
          status: 'error' as const,
          errorMessage: error instanceof Error ? error.message : 'Re-analysis failed',
        } : c)
      );

      toast({
        title: "Re-analysis failed",
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: "destructive",
      });
    }
  }, [contracts, columns, toast]);

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
    for (const contract of contracts.filter(c => c.status === 'completed' && c.filePath)) {
      await reanalyzeContract(contract.id);
    }
    
    toast({
      title: "Column added",
      description: `Added "${pendingSuggestion.termLabel}" and re-analyzed all contracts`,
    });
    
    setIsReanalyzing(false);
    setPendingSuggestion(null);
  }, [pendingSuggestion, columns, contracts, reanalyzeContract, toast]);

  const dismissSuggestion = useCallback(() => {
    setPendingSuggestion(null);
  }, []);

  return {
    contracts,
    columns,
    isProcessing,
    isLoading,
    pendingSuggestion,
    isReanalyzing,
    userId,
    uploadContracts,
    toggleColumn,
    addNewColumn,
    dismissSuggestion,
    reanalyzeContract,
  };
}

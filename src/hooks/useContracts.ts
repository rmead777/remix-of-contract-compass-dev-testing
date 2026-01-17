import { useState, useCallback } from "react";
import { Contract, TableColumn, NewTermSuggestion, DEFAULT_COLUMNS } from "@/types/contract";

// Mock data generator for demo purposes
function generateMockContract(fileName: string): Contract {
  const names = ["John Smith", "Sarah Johnson", "Michael Chen", "Emily Davis", "Robert Wilson"];
  const positions = ["Software Engineer", "Product Manager", "Data Analyst", "Marketing Director", "Sales Lead"];
  const types = ["Full-time", "Part-time", "Contractor"];
  const locations = ["Remote", "Hybrid", "On-site"];
  
  const randomPick = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];
  
  return {
    id: crypto.randomUUID(),
    fileName,
    uploadedAt: new Date(),
    status: 'completed',
    terms: {
      employeeName: { 
        value: randomPick(names), 
        excerpt: "The Employee, hereinafter referred to as 'Employee', agrees to the terms set forth in this agreement...",
        confidence: 0.95
      },
      position: { 
        value: randomPick(positions),
        excerpt: "Employee shall serve in the capacity of [Position] and perform all duties associated with this role...",
        confidence: 0.92
      },
      startDate: { 
        value: new Date(Date.now() + Math.random() * 30 * 24 * 60 * 60 * 1000).toLocaleDateString(),
        excerpt: "Employment shall commence on the Start Date and continue until terminated...",
        confidence: 0.98
      },
      employmentType: { 
        value: randomPick(types),
        excerpt: "This is a full-time position requiring a minimum of 40 hours per week...",
        confidence: 0.96
      },
      salary: { 
        value: `$${(80 + Math.floor(Math.random() * 120))}k/year`,
        excerpt: "Base compensation shall be payable in accordance with Company's standard payroll schedule...",
        confidence: 0.94
      },
      paymentFrequency: { 
        value: "Bi-weekly",
        excerpt: "Payment shall be made on a bi-weekly basis, typically on the 15th and last day of each month...",
        confidence: 0.91
      },
      benefits: { 
        value: "Health, Dental, 401k",
        excerpt: "Employee shall be eligible for the Company's standard benefits package including health insurance...",
        confidence: 0.88
      },
      ptoDays: { 
        value: `${15 + Math.floor(Math.random() * 10)} days`,
        excerpt: "Employee shall accrue paid time off at a rate of X days per year...",
        confidence: 0.93
      },
      noticePeriod: { 
        value: `${2 + Math.floor(Math.random() * 6)} weeks`,
        excerpt: "Either party may terminate this agreement with written notice of not less than X weeks...",
        confidence: 0.89
      },
      nonCompete: { 
        value: Math.random() > 0.3 ? "12 months" : null,
        excerpt: "Employee agrees not to engage in any competing business for a period of 12 months...",
        confidence: 0.87
      },
      confidentiality: { 
        value: "Yes",
        excerpt: "Employee agrees to maintain strict confidentiality regarding all proprietary information...",
        confidence: 0.96
      },
      workLocation: { 
        value: randomPick(locations),
        excerpt: "Employee may work remotely from any location approved by the Company...",
        confidence: 0.94
      },
      reportingTo: { 
        value: Math.random() > 0.5 ? "VP of Engineering" : "Director of Operations",
        excerpt: "Employee shall report directly to the VP of Engineering...",
        confidence: 0.91
      },
    },
  };
}

export function useContracts() {
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [columns, setColumns] = useState<TableColumn[]>(DEFAULT_COLUMNS);
  const [isProcessing, setIsProcessing] = useState(false);
  const [pendingSuggestion, setPendingSuggestion] = useState<NewTermSuggestion | null>(null);
  const [isReanalyzing, setIsReanalyzing] = useState(false);

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
    
    // Simulate processing each file
    for (const contract of newContracts) {
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const processedContract = generateMockContract(contract.fileName);
      processedContract.id = contract.id;
      processedContract.uploadedAt = contract.uploadedAt;
      
      setContracts(prev => 
        prev.map(c => c.id === contract.id ? processedContract : c)
      );
      
      // Randomly suggest a new term (for demo)
      if (Math.random() > 0.7 && contracts.length > 0) {
        setPendingSuggestion({
          termId: 'signingBonus',
          termLabel: 'Signing Bonus',
          description: 'One-time payment provided upon acceptance of the employment offer',
          foundInContract: contract.fileName,
          sampleValue: '$15,000',
        });
      }
    }
    
    setIsProcessing(false);
  }, [contracts.length]);

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
    
    // Simulate re-analyzing all contracts
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    setContracts(prev => 
      prev.map(contract => ({
        ...contract,
        terms: {
          ...contract.terms,
          [pendingSuggestion.termId]: {
            value: Math.random() > 0.4 ? '$' + (10 + Math.floor(Math.random() * 20)) + ',000' : null,
            excerpt: 'Upon successful completion of background check, Employee shall receive a signing bonus of...',
            confidence: 0.85,
          },
        },
      }))
    );
    
    setIsReanalyzing(false);
    setPendingSuggestion(null);
  }, [pendingSuggestion, columns.length]);

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

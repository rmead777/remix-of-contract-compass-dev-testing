import { supabase } from '@/integrations/supabase/client';
import { ContractTerm, NewTermSuggestion } from '@/types/contract';

type AnalyzeContractResponse = {
  success: boolean;
  error?: string;
  terms?: Record<string, ContractTerm>;
  suggestedNewTerms?: NewTermSuggestion[];
};

export async function analyzeContract(
  contractText: string, 
  fileName: string,
  existingColumns: string[]
): Promise<AnalyzeContractResponse> {
  try {
    const { data, error } = await supabase.functions.invoke('analyze-contract', {
      body: { 
        contractText, 
        fileName,
        existingColumns 
      },
    });

    if (error) {
      console.error('Edge function error:', error);
      return { success: false, error: error.message };
    }

    if (!data.success) {
      return { success: false, error: data.error || 'Failed to analyze contract' };
    }

    // Transform the response to match our ContractTerm interface
    const terms: Record<string, ContractTerm> = {};
    const termKeys = [
      'employeeName', 'position', 'startDate', 'employmentType', 'salary',
      'paymentFrequency', 'benefits', 'ptoDays', 'noticePeriod', 'nonCompete',
      'confidentiality', 'workLocation', 'reportingTo', 'terminationProvisions',
      'terminationForCause', 'terminationWithoutCause', 'severancePay'
    ];

    for (const key of termKeys) {
      if (data.terms[key]) {
        terms[key] = {
          value: data.terms[key].value || null,
          excerpt: data.terms[key].excerpt,
          confidence: data.terms[key].confidence
        };
      }
    }

    // Handle suggested new terms
    const suggestedNewTerms: NewTermSuggestion[] = (data.suggestedNewTerms || []).map((term: any) => ({
      termId: term.termId,
      termLabel: term.termLabel,
      description: term.description,
      foundInContract: fileName,
      sampleValue: term.sampleValue
    }));

    return { 
      success: true, 
      terms,
      suggestedNewTerms 
    };
  } catch (error) {
    console.error('Error calling analyze-contract:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to analyze contract' 
    };
  }
}

// Convert file to base64
async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const result = reader.result as string;
      // Remove the data URL prefix (e.g., "data:application/pdf;base64,")
      const base64 = result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = (error) => reject(error);
  });
}

// Parse document using AI vision
async function parseDocumentWithAI(file: File): Promise<string> {
  const base64 = await fileToBase64(file);
  
  const { data, error } = await supabase.functions.invoke('parse-document', {
    body: {
      fileBase64: base64,
      mimeType: file.type,
      fileName: file.name
    }
  });

  if (error) {
    console.error('Document parsing error:', error);
    throw new Error(`Failed to parse document: ${error.message}`);
  }

  if (!data.success) {
    throw new Error(data.error || 'Failed to parse document');
  }

  return data.text;
}

// Extract text from file - now uses AI for PDFs/images
export async function extractTextFromFile(file: File): Promise<string> {
  // For plain text files, read directly
  if (file.type === 'text/plain') {
    return await file.text();
  }

  // For PDFs and images, use AI vision to extract text
  const supportedTypes = [
    'application/pdf',
    'image/png',
    'image/jpeg',
    'image/webp',
    'image/gif'
  ];

  if (supportedTypes.includes(file.type)) {
    console.log(`Parsing ${file.name} with AI vision...`);
    return await parseDocumentWithAI(file);
  }

  // For Word documents (.docx), we need special handling
  if (file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
    // Convert to PDF-like handling via AI
    console.log(`Parsing Word document ${file.name} with AI...`);
    return await parseDocumentWithAI(file);
  }

  // Unsupported file type
  throw new Error(`Unsupported file type: ${file.type}. Please upload PDF, image, or text files.`);
}

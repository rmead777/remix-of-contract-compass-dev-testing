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

// Simple text extraction for demo - in production you'd use a proper PDF/DOCX parser
export async function extractTextFromFile(file: File): Promise<string> {
  // For demo purposes, we'll read text files directly
  // In production, you'd integrate with a document parsing service
  if (file.type === 'text/plain') {
    return await file.text();
  }

  // For PDF/DOCX, return a demo contract text
  // In production, use a library like pdf-parse or mammoth.js
  return generateDemoContractText(file.name);
}

function generateDemoContractText(fileName: string): string {
  const names = ["John Smith", "Sarah Johnson", "Michael Chen", "Emily Davis"];
  const positions = ["Software Engineer", "Product Manager", "Data Analyst", "Marketing Director"];
  const name = names[Math.floor(Math.random() * names.length)];
  const position = positions[Math.floor(Math.random() * positions.length)];
  const salary = 80000 + Math.floor(Math.random() * 120000);
  
  return `
EMPLOYMENT AGREEMENT

This Employment Agreement ("Agreement") is entered into as of ${new Date().toLocaleDateString()}, 
by and between Acme Corporation ("Company") and ${name} ("Employee").

1. POSITION AND DUTIES
Employee is hired as ${position} and shall perform all duties associated with this role.
Employee shall report directly to the VP of Engineering.

2. EMPLOYMENT TERM
Employment shall commence on ${new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toLocaleDateString()} ("Start Date").
This is a full-time position requiring a minimum of 40 hours per week.
Employee may work in a hybrid capacity, with 3 days in-office and 2 days remote.

3. COMPENSATION
Base salary shall be $${salary.toLocaleString()} per year, payable on a bi-weekly basis.
Employee shall be eligible for an annual performance bonus of up to 15% of base salary.

4. BENEFITS
Employee shall be eligible for the Company's standard benefits package including:
- Health, dental, and vision insurance
- 401(k) retirement plan with 4% company match
- Life and disability insurance

5. PAID TIME OFF
Employee shall accrue ${15 + Math.floor(Math.random() * 10)} days of paid time off per year.
Additionally, Employee is entitled to all Company-observed holidays.

6. CONFIDENTIALITY
Employee agrees to maintain strict confidentiality regarding all proprietary information,
trade secrets, and business strategies of the Company, both during and after employment.

7. NON-COMPETE AND NON-SOLICITATION
For a period of 12 months following termination, Employee agrees not to:
- Work for any direct competitor of the Company
- Solicit any employees or customers of the Company

8. TERMINATION PROVISIONS

8.1 Termination for Cause
The Company may terminate Employee's employment immediately for Cause, which includes but is not limited to:
- Gross misconduct or willful violation of Company policies
- Material breach of this Agreement or fiduciary duties
- Conviction of a felony or crime involving moral turpitude
- Fraud, embezzlement, or theft against the Company
- Habitual neglect of duties after written warning
- Disclosure of confidential information
- Insubordination or refusal to follow lawful directives

8.2 Termination Without Cause
Either party may terminate this Agreement without cause by providing ${2 + Math.floor(Math.random() * 6)} weeks written notice.
In the event of termination without cause by the Company:
- Employee shall receive continued base salary for ${Math.floor(Math.random() * 4) + 2} months as severance
- Health benefits shall continue for the severance period
- Any unvested equity shall be forfeited

8.3 Resignation
Employee may resign at any time with 2 weeks written notice.
The Company may, at its discretion, accept immediate resignation and pay out the notice period.

9. SEVERANCE PACKAGE
Upon termination without cause, Employee shall receive:
- Severance payment equal to ${Math.floor(Math.random() * 4) + 2} months of base salary
- Pro-rated bonus for the current year
- Outplacement assistance for up to 3 months
- COBRA coverage subsidy for 6 months

10. GOVERNING LAW
This Agreement shall be governed by the laws of the State of California.

IN WITNESS WHEREOF, the parties have executed this Agreement.

_______________________          _______________________
Company Representative            Employee: ${name}
Date: _______________            Date: _______________
`;
}

export interface ContractTerm {
  value: string | null;
  excerpt?: string;
  confidence?: number;
}

export interface Contract {
  id: string;
  fileName: string;
  uploadedAt: Date;
  status: 'uploading' | 'processing' | 'completed' | 'error';
  errorMessage?: string;
  terms: Record<string, ContractTerm>;
}

export interface TableColumn {
  id: string;
  label: string;
  description?: string;
  isDefault: boolean;
  order: number;
}

export interface NewTermSuggestion {
  termId: string;
  termLabel: string;
  description: string;
  foundInContract: string;
  sampleValue: string;
}

export const DEFAULT_COLUMNS: TableColumn[] = [
  { id: 'employeeName', label: 'Employee Name', isDefault: true, order: 0 },
  { id: 'position', label: 'Position/Title', isDefault: true, order: 1 },
  { id: 'startDate', label: 'Start Date', isDefault: true, order: 2 },
  { id: 'employmentType', label: 'Employment Type', isDefault: true, order: 3 },
  { id: 'salary', label: 'Salary', isDefault: true, order: 4 },
  { id: 'paymentFrequency', label: 'Payment Frequency', isDefault: true, order: 5 },
  { id: 'benefits', label: 'Benefits', isDefault: true, order: 6 },
  { id: 'ptoDays', label: 'PTO Days', isDefault: true, order: 7 },
  { id: 'noticePeriod', label: 'Notice Period', isDefault: true, order: 8 },
  { id: 'nonCompete', label: 'Non-Compete', isDefault: true, order: 9 },
  { id: 'confidentiality', label: 'Confidentiality', isDefault: true, order: 10 },
  { id: 'workLocation', label: 'Work Location', isDefault: true, order: 11 },
  { id: 'reportingTo', label: 'Reports To', isDefault: true, order: 12 },
  { id: 'terminationProvisions', label: 'Termination Provisions', description: 'General termination terms and procedures', isDefault: true, order: 13 },
  { id: 'terminationForCause', label: 'Termination for Cause', description: 'What qualifies as termination for cause', isDefault: true, order: 14 },
  { id: 'terminationWithoutCause', label: 'Termination w/o Cause', description: 'At-will and without cause termination terms', isDefault: true, order: 15 },
  { id: 'severancePay', label: 'Severance Pay', description: 'Severance package upon termination', isDefault: true, order: 16 },
];

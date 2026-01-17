import { supabase } from '@/integrations/supabase/client';

export interface StoredContract {
  id: string;
  user_id: string;
  file_name: string;
  file_path: string;
  file_size: number;
  mime_type: string;
  analysis_data: Record<string, any> | null;
  created_at: string;
  updated_at: string;
}

export async function uploadContractToStorage(
  file: File,
  userId: string
): Promise<{ filePath: string; error: string | null }> {
  const fileExt = file.name.split('.').pop();
  const fileName = `${crypto.randomUUID()}.${fileExt}`;
  const filePath = `${userId}/${fileName}`;

  const { error } = await supabase.storage
    .from('contracts')
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: false,
    });

  if (error) {
    console.error('Storage upload error:', error);
    return { filePath: '', error: error.message };
  }

  return { filePath, error: null };
}

export async function saveContractRecord(
  userId: string,
  fileName: string,
  filePath: string,
  fileSize: number,
  mimeType: string,
  analysisData?: Record<string, any>
): Promise<{ id: string | null; error: string | null }> {
  const { data, error } = await supabase
    .from('contracts')
    .insert({
      user_id: userId,
      file_name: fileName,
      file_path: filePath,
      file_size: fileSize,
      mime_type: mimeType,
      analysis_data: analysisData || null,
    })
    .select('id')
    .single();

  if (error) {
    console.error('Database insert error:', error);
    return { id: null, error: error.message };
  }

  return { id: data.id, error: null };
}

export async function updateContractAnalysis(
  contractId: string,
  analysisData: Record<string, any>
): Promise<{ error: string | null }> {
  const { error } = await supabase
    .from('contracts')
    .update({ analysis_data: analysisData })
    .eq('id', contractId);

  if (error) {
    console.error('Database update error:', error);
    return { error: error.message };
  }

  return { error: null };
}

export async function fetchUserContracts(): Promise<{
  contracts: StoredContract[];
  error: string | null;
}> {
  const { data, error } = await supabase
    .from('contracts')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Database fetch error:', error);
    return { contracts: [], error: error.message };
  }

  return { contracts: data as StoredContract[], error: null };
}

export async function downloadContractFile(
  filePath: string
): Promise<{ blob: Blob | null; error: string | null }> {
  const { data, error } = await supabase.storage
    .from('contracts')
    .download(filePath);

  if (error) {
    console.error('Storage download error:', error);
    return { blob: null, error: error.message };
  }

  return { blob: data, error: null };
}

export async function deleteContract(
  contractId: string,
  filePath: string
): Promise<{ error: string | null }> {
  // Delete from storage first
  const { error: storageError } = await supabase.storage
    .from('contracts')
    .remove([filePath]);

  if (storageError) {
    console.error('Storage delete error:', storageError);
    return { error: storageError.message };
  }

  // Then delete from database
  const { error: dbError } = await supabase
    .from('contracts')
    .delete()
    .eq('id', contractId);

  if (dbError) {
    console.error('Database delete error:', dbError);
    return { error: dbError.message };
  }

  return { error: null };
}

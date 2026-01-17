import { supabase } from '@/integrations/supabase/client';

export type AppRole = 'admin' | 'regular' | 'viewer';

export interface UserRole {
  id: string;
  user_id: string;
  organization_id: string | null;
  role: AppRole;
  created_at: string;
}

// Get user's role in a specific organization
export async function getUserRole(
  userId: string,
  organizationId: string
): Promise<{ role: AppRole | null; error: string | null }> {
  const { data, error } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', userId)
    .eq('organization_id', organizationId)
    .maybeSingle();

  if (error) {
    console.error('Error fetching user role:', error);
    return { role: null, error: error.message };
  }

  return { role: data?.role as AppRole | null, error: null };
}

// Get all roles for a user across organizations
export async function getUserRoles(
  userId: string
): Promise<{ roles: UserRole[]; error: string | null }> {
  const { data, error } = await supabase
    .from('user_roles')
    .select('*')
    .eq('user_id', userId);

  if (error) {
    console.error('Error fetching user roles:', error);
    return { roles: [], error: error.message };
  }

  return { roles: data as UserRole[], error: null };
}

// Set user's role in an organization (admin only)
export async function setUserRole(
  userId: string,
  organizationId: string,
  role: AppRole
): Promise<{ error: string | null }> {
  const { error } = await supabase
    .from('user_roles')
    .upsert(
      {
        user_id: userId,
        organization_id: organizationId,
        role: role,
      },
      {
        onConflict: 'user_id,organization_id',
      }
    );

  if (error) {
    console.error('Error setting user role:', error);
    return { error: error.message };
  }

  return { error: null };
}

// Remove user's role from an organization (admin only)
export async function removeUserRole(
  userId: string,
  organizationId: string
): Promise<{ error: string | null }> {
  const { error } = await supabase
    .from('user_roles')
    .delete()
    .eq('user_id', userId)
    .eq('organization_id', organizationId);

  if (error) {
    console.error('Error removing user role:', error);
    return { error: error.message };
  }

  return { error: null };
}

// Get all members with roles for an organization (for admin management)
export async function getOrganizationMembersWithRoles(
  organizationId: string
): Promise<{ members: UserRole[]; error: string | null }> {
  const { data, error } = await supabase
    .from('user_roles')
    .select('*')
    .eq('organization_id', organizationId)
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Error fetching org members:', error);
    return { members: [], error: error.message };
  }

  return { members: data as UserRole[], error: null };
}

// Check if user can upload contracts
export function canUploadContracts(role: AppRole | null): boolean {
  return role === 'admin' || role === 'regular';
}

// Check if user can delete contracts
export function canDeleteContracts(role: AppRole | null): boolean {
  return role === 'admin' || role === 'regular';
}

// Check if user can manage organization members
export function canManageMembers(role: AppRole | null): boolean {
  return role === 'admin';
}

// Check if user can view contracts
export function canViewContracts(role: AppRole | null): boolean {
  return role === 'admin' || role === 'regular' || role === 'viewer';
}

// Get role display label
export function getRoleLabel(role: AppRole): string {
  switch (role) {
    case 'admin':
      return 'Admin';
    case 'regular':
      return 'Regular User';
    case 'viewer':
      return 'View Only';
    default:
      return role;
  }
}

// Get role description
export function getRoleDescription(role: AppRole): string {
  switch (role) {
    case 'admin':
      return 'Full access: manage users, upload, delete, and view contracts';
    case 'regular':
      return 'Can upload, delete, and view contracts';
    case 'viewer':
      return 'Can only view the summary table';
    default:
      return '';
  }
}

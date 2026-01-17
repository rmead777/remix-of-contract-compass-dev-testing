import { supabase } from '@/integrations/supabase/client';

export interface Organization {
  id: string;
  name: string;
  created_at: string;
  updated_at: string;
}

export interface OrganizationMember {
  id: string;
  organization_id: string;
  user_id: string;
  role: 'owner' | 'admin' | 'member';
  created_at: string;
}

export async function createOrganization(
  name: string,
  userId: string
): Promise<{ organization: Organization | null; error: string | null }> {
  // Create organization
  const { data: org, error: orgError } = await supabase
    .from('organizations')
    .insert({ name })
    .select()
    .single();

  if (orgError) {
    console.error('Error creating organization:', orgError);
    return { organization: null, error: orgError.message };
  }

  // Add creator as owner
  const { error: memberError } = await supabase
    .from('organization_members')
    .insert({
      organization_id: org.id,
      user_id: userId,
      role: 'owner',
    });

  if (memberError) {
    console.error('Error adding owner:', memberError);
    // Rollback org creation
    await supabase.from('organizations').delete().eq('id', org.id);
    return { organization: null, error: memberError.message };
  }

  return { organization: org as Organization, error: null };
}

export async function getUserOrganizations(
  userId: string
): Promise<{ organizations: Array<{ organization: Organization; role: string }>; error: string | null }> {
  const { data, error } = await supabase
    .from('organization_members')
    .select(`
      role,
      organizations (
        id,
        name,
        created_at,
        updated_at
      )
    `)
    .eq('user_id', userId);

  if (error) {
    console.error('Error fetching user organizations:', error);
    return { organizations: [], error: error.message };
  }

  if (!data || data.length === 0) {
    return { organizations: [], error: null };
  }

  const organizations = data.map((item) => ({
    organization: item.organizations as unknown as Organization,
    role: item.role,
  }));

  return { organizations, error: null };
}

export async function joinOrganization(
  organizationId: string,
  userId: string
): Promise<{ error: string | null }> {
  const { error } = await supabase
    .from('organization_members')
    .insert({
      organization_id: organizationId,
      user_id: userId,
      role: 'member',
    });

  if (error) {
    console.error('Error joining organization:', error);
    return { error: error.message };
  }

  return { error: null };
}

export async function getOrganizationMembers(
  organizationId: string
): Promise<{ members: OrganizationMember[]; error: string | null }> {
  const { data, error } = await supabase
    .from('organization_members')
    .select('*')
    .eq('organization_id', organizationId)
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Error fetching members:', error);
    return { members: [], error: error.message };
  }

  return { members: data as OrganizationMember[], error: null };
}

export async function findOrganizationByName(
  name: string
): Promise<{ organization: Organization | null; error: string | null }> {
  const { data, error } = await supabase
    .from('organizations')
    .select('*')
    .ilike('name', name)
    .maybeSingle();

  if (error) {
    console.error('Error finding organization:', error);
    return { organization: null, error: error.message };
  }

  return { organization: data as Organization | null, error: null };
}

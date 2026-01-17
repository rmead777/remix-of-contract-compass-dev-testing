-- Create enum for app roles
CREATE TYPE public.app_role AS ENUM ('admin', 'regular', 'viewer');

-- Create user_roles table (roles stored separately from users for security)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  role app_role NOT NULL DEFAULT 'viewer',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (user_id, organization_id)
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create indexes for performance
CREATE INDEX idx_user_roles_user_id ON public.user_roles(user_id);
CREATE INDEX idx_user_roles_org_id ON public.user_roles(organization_id);

-- Security definer function to check if user has a specific role in an org
CREATE OR REPLACE FUNCTION public.has_org_role(_user_id UUID, _org_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id 
      AND organization_id = _org_id 
      AND role = _role
  )
$$;

-- Security definer function to check if user has at least a certain role level
-- admin > regular > viewer
CREATE OR REPLACE FUNCTION public.has_org_role_or_higher(_user_id UUID, _org_id UUID, _min_role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id 
      AND organization_id = _org_id 
      AND (
        role = 'admin' 
        OR (_min_role = 'regular' AND role IN ('admin', 'regular'))
        OR (_min_role = 'viewer' AND role IN ('admin', 'regular', 'viewer'))
      )
  )
$$;

-- Security definer function to get user's role in an org
CREATE OR REPLACE FUNCTION public.get_user_org_role(_user_id UUID, _org_id UUID)
RETURNS app_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.user_roles
  WHERE user_id = _user_id AND organization_id = _org_id
  LIMIT 1
$$;

-- Security definer function to check if user is a global admin (admin in any org with NULL org_id)
CREATE OR REPLACE FUNCTION public.is_global_admin(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id 
      AND organization_id IS NULL 
      AND role = 'admin'
  )
$$;

-- RLS policies for user_roles table

-- Users can view roles in their organizations
CREATE POLICY "Users can view roles in their orgs"
ON public.user_roles FOR SELECT
USING (
  public.is_global_admin(auth.uid())
  OR public.is_org_member(auth.uid(), organization_id)
);

-- Only admins can insert/update/delete roles
CREATE POLICY "Admins can manage roles"
ON public.user_roles FOR INSERT
WITH CHECK (
  public.is_global_admin(auth.uid())
  OR public.has_org_role(auth.uid(), organization_id, 'admin')
);

CREATE POLICY "Admins can update roles"
ON public.user_roles FOR UPDATE
USING (
  public.is_global_admin(auth.uid())
  OR public.has_org_role(auth.uid(), organization_id, 'admin')
);

CREATE POLICY "Admins can delete roles"
ON public.user_roles FOR DELETE
USING (
  public.is_global_admin(auth.uid())
  OR public.has_org_role(auth.uid(), organization_id, 'admin')
);

-- Update contracts RLS policies for role-based access
DROP POLICY IF EXISTS "Users can view org contracts" ON public.contracts;
DROP POLICY IF EXISTS "Users can insert contracts" ON public.contracts;
DROP POLICY IF EXISTS "Users can update own contracts" ON public.contracts;
DROP POLICY IF EXISTS "Users can delete own contracts" ON public.contracts;

-- Viewers and above can see contracts
CREATE POLICY "Users can view org contracts"
ON public.contracts FOR SELECT
USING (
  auth.uid() = user_id 
  OR public.is_global_admin(auth.uid())
  OR (organization_id IS NOT NULL AND public.has_org_role_or_higher(auth.uid(), organization_id, 'viewer'))
);

-- Regular users and above can insert contracts
CREATE POLICY "Regular users can insert contracts"
ON public.contracts FOR INSERT
WITH CHECK (
  auth.uid() = user_id
  AND (
    organization_id IS NULL
    OR public.is_global_admin(auth.uid())
    OR public.has_org_role_or_higher(auth.uid(), organization_id, 'regular')
  )
);

-- Regular users and above can update their own contracts
CREATE POLICY "Regular users can update contracts"
ON public.contracts FOR UPDATE
USING (
  auth.uid() = user_id
  OR public.is_global_admin(auth.uid())
  OR (organization_id IS NOT NULL AND public.has_org_role(auth.uid(), organization_id, 'admin'))
);

-- Regular users can delete their own contracts, admins can delete any
CREATE POLICY "Regular users can delete contracts"
ON public.contracts FOR DELETE
USING (
  (auth.uid() = user_id AND (
    organization_id IS NULL 
    OR public.has_org_role_or_higher(auth.uid(), organization_id, 'regular')
  ))
  OR public.is_global_admin(auth.uid())
  OR (organization_id IS NOT NULL AND public.has_org_role(auth.uid(), organization_id, 'admin'))
);

-- Migrate existing organization_members to user_roles
-- Set owners as admins, admins as admins, members as regular
INSERT INTO public.user_roles (user_id, organization_id, role)
SELECT 
  user_id, 
  organization_id,
  CASE 
    WHEN role = 'owner' THEN 'admin'::app_role
    WHEN role = 'admin' THEN 'admin'::app_role
    ELSE 'regular'::app_role
  END
FROM public.organization_members
ON CONFLICT (user_id, organization_id) DO NOTHING;
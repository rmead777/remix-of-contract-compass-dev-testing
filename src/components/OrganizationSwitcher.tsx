import { Organization } from "@/lib/api/organizations";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Building2 } from "lucide-react";

interface OrganizationSwitcherProps {
  organizations: Array<{ organization: Organization; role: string }>;
  selectedOrganization: Organization | null;
  onSelect: (org: Organization) => void;
}

export function OrganizationSwitcher({
  organizations,
  selectedOrganization,
  onSelect,
}: OrganizationSwitcherProps) {
  if (organizations.length === 0) {
    return null;
  }

  if (organizations.length === 1) {
    return (
      <div className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-secondary text-secondary-foreground rounded-md">
        <Building2 className="h-3.5 w-3.5" />
        {organizations[0].organization.name}
      </div>
    );
  }

  return (
    <Select
      value={selectedOrganization?.id || ""}
      onValueChange={(value) => {
        const org = organizations.find((o) => o.organization.id === value);
        if (org) {
          onSelect(org.organization);
        }
      }}
    >
      <SelectTrigger className="w-[180px] h-8">
        <Building2 className="h-3.5 w-3.5 mr-2" />
        <SelectValue placeholder="Select organization" />
      </SelectTrigger>
      <SelectContent>
        {organizations.map(({ organization, role }) => (
          <SelectItem key={organization.id} value={organization.id}>
            <span className="flex items-center gap-2">
              {organization.name}
              <span className="text-xs text-muted-foreground">({role})</span>
            </span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

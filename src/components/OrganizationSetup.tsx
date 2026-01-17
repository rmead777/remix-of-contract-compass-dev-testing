import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { createOrganization, joinOrganization, findOrganizationByName } from "@/lib/api/organizations";
import { useToast } from "@/hooks/use-toast";
import { Building2, Users } from "lucide-react";

interface OrganizationSetupProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  onSuccess: () => void;
}

export function OrganizationSetup({ isOpen, onClose, userId, onSuccess }: OrganizationSetupProps) {
  const [orgName, setOrgName] = useState("");
  const [joinOrgName, setJoinOrgName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orgName.trim()) return;

    setIsLoading(true);
    const { organization, error } = await createOrganization(orgName.trim(), userId);
    setIsLoading(false);

    if (error) {
      toast({
        title: "Error",
        description: error,
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Organization created",
      description: `"${organization?.name}" is ready. You can now invite team members.`,
    });
    onSuccess();
    onClose();
  };

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!joinOrgName.trim()) return;

    setIsLoading(true);
    
    // First find the organization
    const { organization, error: findError } = await findOrganizationByName(joinOrgName.trim());
    
    if (findError || !organization) {
      setIsLoading(false);
      toast({
        title: "Organization not found",
        description: "Please check the organization name and try again.",
        variant: "destructive",
      });
      return;
    }

    // Join the organization
    const { error: joinError } = await joinOrganization(organization.id, userId);
    setIsLoading(false);

    if (joinError) {
      toast({
        title: "Error joining",
        description: joinError.includes("duplicate") 
          ? "You're already a member of this organization" 
          : joinError,
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Joined organization",
      description: `You're now a member of "${organization.name}"`,
    });
    onSuccess();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Set Up Your Team</DialogTitle>
          <DialogDescription>
            Create a new organization or join an existing one to share contracts with your team.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="create" className="mt-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="create" className="gap-2">
              <Building2 className="h-4 w-4" />
              Create
            </TabsTrigger>
            <TabsTrigger value="join" className="gap-2">
              <Users className="h-4 w-4" />
              Join
            </TabsTrigger>
          </TabsList>

          <TabsContent value="create" className="mt-4">
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="org-name">Organization Name</Label>
                <Input
                  id="org-name"
                  value={orgName}
                  onChange={(e) => setOrgName(e.target.value)}
                  placeholder="Acme Corp"
                  required
                />
              </div>
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Creating..." : "Create Organization"}
              </Button>
            </form>
          </TabsContent>

          <TabsContent value="join" className="mt-4">
            <form onSubmit={handleJoin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="join-org-name">Organization Name</Label>
                <Input
                  id="join-org-name"
                  value={joinOrgName}
                  onChange={(e) => setJoinOrgName(e.target.value)}
                  placeholder="Enter organization name"
                  required
                />
              </div>
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Joining..." : "Join Organization"}
              </Button>
            </form>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

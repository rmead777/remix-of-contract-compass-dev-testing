import { useState } from "react";
import { Header } from "@/components/Header";
import { FileUpload } from "@/components/FileUpload";
import { ContractTable } from "@/components/ContractTable";
import { StatsCards } from "@/components/StatsCards";
import { NewTermModal } from "@/components/NewTermModal";
import { AuthModal } from "@/components/AuthModal";
import { OrganizationSetup } from "@/components/OrganizationSetup";
import { OrganizationSwitcher } from "@/components/OrganizationSwitcher";
import { useContracts } from "@/hooks/useContracts";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table2, LogIn, LogOut, Loader2, Plus, Shield, Eye } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { getRoleLabel } from "@/lib/api/roles";

const Index = () => {
  const {
    contracts,
    columns,
    isProcessing,
    isLoading,
    pendingSuggestion,
    isReanalyzing,
    userId,
    organizations,
    selectedOrganization,
    currentRole,
    needsOrgSetup,
    canUpload,
    uploadContracts,
    toggleColumn,
    addNewColumn,
    dismissSuggestion,
    refreshContracts,
    selectOrganization,
  } = useContracts();

  const [showTable, setShowTable] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showOrgSetup, setShowOrgSetup] = useState(false);

  const handleViewSummary = () => {
    if (!userId) {
      setShowAuthModal(true);
    } else if (needsOrgSetup) {
      setShowOrgSetup(true);
    } else {
      setShowTable(true);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setShowTable(false);
  };

  const handleOrgSetupSuccess = () => {
    refreshContracts();
    setShowTable(true);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="animate-fade-in space-y-8">
          {/* Auth Status */}
          <div className="flex items-center justify-end gap-3 flex-wrap">
            {userId && organizations.length > 0 && (
              <OrganizationSwitcher
                organizations={organizations}
                selectedOrganization={selectedOrganization}
                onSelect={selectOrganization}
              />
            )}
            {userId && currentRole && (
              <Badge variant="outline" className="gap-1.5">
                {currentRole === 'admin' ? (
                  <Shield className="h-3 w-3" />
                ) : currentRole === 'viewer' ? (
                  <Eye className="h-3 w-3" />
                ) : null}
                {getRoleLabel(currentRole)}
              </Badge>
            )}
            {userId ? (
              <>
                <Button variant="outline" size="sm" onClick={() => setShowOrgSetup(true)} className="gap-2">
                  <Plus className="h-4 w-4" />
                  {needsOrgSetup ? "Set Up Team" : "Add Team"}
                </Button>
                <Button variant="ghost" size="sm" onClick={handleSignOut} className="gap-2">
                  <LogOut className="h-4 w-4" />
                  Sign Out
                </Button>
              </>
            ) : (
              <Button variant="ghost" size="sm" onClick={() => setShowAuthModal(true)} className="gap-2">
                <LogIn className="h-4 w-4" />
                Sign In
              </Button>
            )}
          </div>

          {/* Hero Section */}
          <section className="text-center">
            <h2 className="font-serif text-3xl font-bold text-foreground sm:text-4xl">
              Employment Contract Intelligence
            </h2>
            <p className="mx-auto mt-3 max-w-2xl text-lg text-muted-foreground">
              Upload your contracts and let AI extract key terms into a dynamic, 
              searchable table. Discover patterns and ensure compliance at scale.
            </p>
          </section>

          {/* Upload Section - only show for users who can upload */}
          {(!userId || canUpload) && (
            <section className="card-elevated mx-auto max-w-2xl p-6">
              <h3 className="mb-4 font-serif text-lg font-semibold text-foreground">
                Upload Contracts
              </h3>
              <FileUpload 
                onFilesSelected={uploadContracts} 
                isProcessing={isProcessing} 
              />
            </section>
          )}

          {/* View-only notice for viewers */}
          {userId && currentRole === 'viewer' && (
            <section className="card-elevated mx-auto max-w-2xl p-6 bg-muted/50">
              <div className="flex items-center gap-3 text-muted-foreground">
                <Eye className="h-5 w-5" />
                <div>
                  <p className="font-medium text-foreground">View-Only Access</p>
                  <p className="text-sm">You can view the contract summary but cannot upload or delete contracts.</p>
                </div>
              </div>
            </section>
          )}

          {/* Stats */}
          {contracts.length > 0 && (
            <section className="animate-slide-up">
              <StatsCards contracts={contracts} />
            </section>
          )}

          {/* View Summary Button */}
          {!showTable && (
            <section className="flex justify-center animate-slide-up">
              <Button
                onClick={handleViewSummary}
                size="lg"
                className="gap-2"
                disabled={isLoading}
              >
                {isLoading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <Table2 className="h-5 w-5" />
                )}
                View Summary
              </Button>
            </section>
          )}

          {/* Contracts Table */}
          {showTable && (
            <section className="animate-slide-up">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-serif text-xl font-semibold text-foreground">
                  Contract Analysis
                </h3>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowTable(false)}
                >
                  Hide Summary
                </Button>
              </div>
              <ContractTable
                contracts={contracts}
                columns={columns}
                onColumnToggle={toggleColumn}
                isLoading={isProcessing && contracts.length === 0}
              />
            </section>
          )}
        </div>
      </main>

      {/* Auth Modal */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onSuccess={() => {
          if (needsOrgSetup) {
            setShowOrgSetup(true);
          } else {
            setShowTable(true);
          }
        }}
      />

      {/* Organization Setup Modal */}
      {userId && (
        <OrganizationSetup
          isOpen={showOrgSetup}
          onClose={() => setShowOrgSetup(false)}
          userId={userId}
          onSuccess={handleOrgSetupSuccess}
        />
      )}

      {/* New Term Suggestion Modal */}
      <NewTermModal
        isOpen={!!pendingSuggestion}
        onClose={dismissSuggestion}
        suggestion={pendingSuggestion}
        onConfirm={addNewColumn}
        onDismiss={dismissSuggestion}
        isReanalyzing={isReanalyzing}
      />
    </div>
  );
};

export default Index;

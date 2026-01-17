import { useState } from "react";
import { Header } from "@/components/Header";
import { FileUpload } from "@/components/FileUpload";
import { ContractTable } from "@/components/ContractTable";
import { StatsCards } from "@/components/StatsCards";
import { NewTermModal } from "@/components/NewTermModal";
import { useContracts } from "@/hooks/useContracts";
import { Button } from "@/components/ui/button";
import { Table2 } from "lucide-react";

const Index = () => {
  const {
    contracts,
    columns,
    isProcessing,
    pendingSuggestion,
    isReanalyzing,
    uploadContracts,
    toggleColumn,
    addNewColumn,
    dismissSuggestion,
  } = useContracts();

  const [showTable, setShowTable] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="animate-fade-in space-y-8">
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

          {/* Upload Section */}
          <section className="card-elevated mx-auto max-w-2xl p-6">
            <h3 className="mb-4 font-serif text-lg font-semibold text-foreground">
              Upload Contracts
            </h3>
            <FileUpload 
              onFilesSelected={uploadContracts} 
              isProcessing={isProcessing} 
            />
          </section>

          {/* Stats */}
          {contracts.length > 0 && (
            <section className="animate-slide-up">
              <StatsCards contracts={contracts} />
            </section>
          )}

          {/* View Summary Button */}
          {contracts.length > 0 && !showTable && (
            <section className="flex justify-center animate-slide-up">
              <Button
                onClick={() => setShowTable(true)}
                size="lg"
                className="gap-2"
              >
                <Table2 className="h-5 w-5" />
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

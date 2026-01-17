import { Header } from "@/components/Header";
import { FileUpload } from "@/components/FileUpload";
import { ContractTable } from "@/components/ContractTable";
import { StatsCards } from "@/components/StatsCards";
import { NewTermModal } from "@/components/NewTermModal";
import { useContracts } from "@/hooks/useContracts";

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

          {/* Contracts Table */}
          <section className="animate-slide-up">
            <h3 className="mb-4 font-serif text-xl font-semibold text-foreground">
              Contract Analysis
            </h3>
            <ContractTable
              contracts={contracts}
              columns={columns}
              onColumnToggle={toggleColumn}
              isLoading={isProcessing && contracts.length === 0}
            />
          </section>
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

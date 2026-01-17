import { FileText, CheckCircle2, Clock, AlertTriangle } from "lucide-react";
import { Contract } from "@/types/contract";

interface StatsCardsProps {
  contracts: Contract[];
}

export function StatsCards({ contracts }: StatsCardsProps) {
  const totalContracts = contracts.length;
  const completedContracts = contracts.filter(c => c.status === 'completed').length;
  const processingContracts = contracts.filter(c => c.status === 'processing').length;
  const errorContracts = contracts.filter(c => c.status === 'error').length;

  const stats = [
    {
      label: "Total Contracts",
      value: totalContracts,
      icon: FileText,
      color: "text-primary",
      bg: "bg-primary/10",
    },
    {
      label: "Analyzed",
      value: completedContracts,
      icon: CheckCircle2,
      color: "text-success",
      bg: "bg-success/10",
    },
    {
      label: "Processing",
      value: processingContracts,
      icon: Clock,
      color: "text-secondary",
      bg: "bg-secondary/10",
    },
    {
      label: "Errors",
      value: errorContracts,
      icon: AlertTriangle,
      color: "text-destructive",
      bg: "bg-destructive/10",
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      {stats.map((stat) => (
        <div
          key={stat.label}
          className="card-elevated card-hover flex items-center gap-4 p-4"
        >
          <div className={`flex h-12 w-12 items-center justify-center rounded-lg ${stat.bg}`}>
            <stat.icon className={`h-6 w-6 ${stat.color}`} />
          </div>
          <div>
            <p className="text-2xl font-bold text-foreground">{stat.value}</p>
            <p className="text-sm text-muted-foreground">{stat.label}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

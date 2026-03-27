import { Cpu, CheckCircle2 } from "lucide-react";

interface ThinkingVisualizerProps {
  steps: string[];
  isLoading: boolean;
}

export function ThinkingVisualizer({ steps, isLoading }: ThinkingVisualizerProps) {
  if (steps.length === 0) return null;

  return (
    <div className="glass-card rounded-xl p-5 space-y-3">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-lg bg-primary/20 border border-primary/30 flex items-center justify-center">
          <Cpu className="w-4 h-4 text-primary" />
        </div>
        <span className="text-sm font-semibold text-foreground font-mono">AI 选校思考过程</span>
        {isLoading && (
          <div className="ml-auto relative">
            <div className="w-2.5 h-2.5 rounded-full bg-primary" />
            <div className="absolute inset-0 w-2.5 h-2.5 rounded-full bg-primary cyber-ping" />
          </div>
        )}
      </div>
      <div className="space-y-1.5 pl-2 border-l-2 border-primary/20">
        {steps.map((step, i) => (
          <div
            key={i}
            className="flex items-center gap-2 text-xs animate-message-in"
            style={{ animationDelay: `${i * 50}ms` }}
          >
            {step.startsWith("✅") ? (
              <CheckCircle2 className="w-3.5 h-3.5 text-success shrink-0" />
            ) : (
              <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                i === steps.length - 1 && isLoading ? "bg-primary cyber-ping" : "bg-primary/50"
              }`} />
            )}
            <span className={`font-mono ${step.startsWith("✅") ? "text-success" : "text-muted-foreground"}`}>
              {step}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

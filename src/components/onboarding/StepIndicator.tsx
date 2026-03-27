import { Check } from "lucide-react";

interface Step {
  label: string;
  status: "completed" | "current" | "upcoming";
}

interface StepIndicatorProps {
  steps: Step[];
}

export function StepIndicator({ steps }: StepIndicatorProps) {
  return (
    <div className="flex items-center justify-center gap-2 py-4 px-6 bg-white border-b border-gray-200">
      {steps.map((step, index) => (
        <div key={index} className="flex items-center gap-2">
          <div className="flex items-center gap-2">
            <div
              className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-semibold transition-all ${
                step.status === "completed"
                  ? "bg-green-500 text-white"
                  : step.status === "current"
                  ? "bg-blue-500 text-white"
                  : "bg-gray-200 text-gray-400"
              }`}
            >
              {step.status === "completed" ? (
                <Check className="w-4 h-4" />
              ) : (
                index + 1
              )}
            </div>
            <span
              className={`text-sm font-medium ${
                step.status === "current"
                  ? "text-blue-600"
                  : step.status === "completed"
                  ? "text-gray-900"
                  : "text-gray-400"
              }`}
            >
              {step.label}
            </span>
          </div>
          {index < steps.length - 1 && (
            <div
              className={`w-12 h-0.5 ${
                step.status === "completed" ? "bg-green-500" : "bg-gray-200"
              }`}
            />
          )}
        </div>
      ))}
    </div>
  );
}

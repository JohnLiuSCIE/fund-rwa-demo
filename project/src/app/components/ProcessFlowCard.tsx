import { Card, CardContent } from "./ui/card";
import { ArrowRight } from "lucide-react";

interface Step {
  label: string;
  description: string;
}

interface ProcessFlowCardProps {
  title: string;
  steps: Step[];
}

export function ProcessFlowCard({ title, steps }: ProcessFlowCardProps) {
  return (
    <Card className="bg-gradient-to-br from-[var(--navy-50)] to-white border-[var(--navy-200)]">
      <CardContent className="pt-6">
        <h3 className="mb-4" style={{ fontFamily: 'var(--font-heading)' }}>
          {title}
        </h3>
        <div className="flex items-center gap-3 overflow-x-auto pb-2">
          {steps.map((step, index) => (
            <div key={index} className="flex items-center gap-3 flex-shrink-0">
              <div className="flex flex-col items-center min-w-32">
                <div className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-medium mb-2">
                  {index + 1}
                </div>
                <div className="text-sm font-medium text-center mb-1">
                  {step.label}
                </div>
                <div className="text-xs text-muted-foreground text-center">
                  {step.description}
                </div>
              </div>
              {index < steps.length - 1 && (
                <ArrowRight className="w-5 h-5 text-muted-foreground flex-shrink-0 mt-[-40px]" />
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

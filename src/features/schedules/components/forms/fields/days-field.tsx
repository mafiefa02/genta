import { useBusinessDays } from "@features/profiles/hooks";
import { Button } from "@shared/components/ui/button";
import { Field, FieldLabel } from "@shared/components/ui/field";
import { cn } from "@shared/lib/utils";
import { useCallback } from "react";
import { scheduleFormContext } from "../context";

const DAY_LABELS: Record<number, string> = {
  1: "Mon",
  2: "Tue",
  3: "Wed",
  4: "Thu",
  5: "Fri",
  6: "Sat",
  7: "Sun",
};

interface DaysFieldProps {
  label: string;
}

export const DaysField = ({ label }: DaysFieldProps) => {
  const field = scheduleFormContext.useFieldContext<number[]>();
  const selectedDays = field.state.value;
  const businessDays = useBusinessDays();

  const handleToggle = useCallback(
    (day: number) => {
      const isSelected = selectedDays.includes(day);
      const next = isSelected
        ? selectedDays.filter((d) => d !== day)
        : [...selectedDays, day].sort((a, b) => a - b);

      return next.length > 0
        ? field.handleChange(next)
        : field.form.resetField(field.name);
    },
    [field, selectedDays],
  );

  return (
    <Field
      name={field.name}
      invalid={field.state.meta.errors.length > 0}
    >
      <FieldLabel>{label}</FieldLabel>
      <div className="flex w-full items-center gap-1">
        {businessDays.map((day) => {
          const isActive = selectedDays.includes(day);
          return (
            <Button
              key={day}
              variant={isActive ? "default" : "outline"}
              size="sm"
              className={cn("flex-1", !isActive && "text-muted-foreground")}
              onClick={() => handleToggle(day)}
            >
              {DAY_LABELS[day]}
            </Button>
          );
        })}
      </div>
    </Field>
  );
};

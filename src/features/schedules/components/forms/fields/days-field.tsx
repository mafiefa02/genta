import { Field, FieldLabel } from "@shared/components/ui/field";
import {
  Toggle,
  ToggleGroup,
  ToggleGroupSeparator,
} from "@shared/components/ui/toggle-group";
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
  businessDays: number[];
}

export const DaysField = ({ label, businessDays }: DaysFieldProps) => {
  const field = scheduleFormContext.useFieldContext<number[]>();
  const value = field.state.value.map(String);
  const handleChange = useCallback(
    (value: string[]) => {
      const mapped = value.map(Number);
      return value.length > 0 && mapped.every((v) => !isNaN(v))
        ? field.handleChange(mapped)
        : field.form.resetField(field.name);
    },
    [field],
  );

  return (
    <Field
      name={field.name}
      invalid={field.state.meta.errors.length > 0}
    >
      <FieldLabel>{label}</FieldLabel>
      <ToggleGroup
        value={value}
        onValueChange={handleChange}
        onBlur={field.handleBlur}
        variant="outline"
        className="w-full"
        multiple
      >
        {businessDays.map((day, i) => (
          <span key={day} className="contents">
            {i > 0 && <ToggleGroupSeparator />}
            <Toggle className="flex-1" value={String(day)}>
              {DAY_LABELS[day]}
            </Toggle>
          </span>
        ))}
      </ToggleGroup>
    </Field>
  );
};

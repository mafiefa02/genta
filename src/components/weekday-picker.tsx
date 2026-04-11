import { ToggleGroup, ToggleGroupItem } from "-/components/ui/toggle-group";

export const WEEKDAYS = [
  { value: 1, label: "Sen" },
  { value: 2, label: "Sel" },
  { value: 3, label: "Rab" },
  { value: 4, label: "Kam" },
  { value: 5, label: "Jum" },
  { value: 6, label: "Sab" },
  { value: 7, label: "Min" },
] as const;

interface WeekdayPickerProps {
  value: number[];
  onChange: (days: number[]) => void;
  disabled?: boolean;
}

export function WeekdayPicker({ value, onChange, disabled }: WeekdayPickerProps) {
  return (
    <ToggleGroup
      multiple
      size="sm"
      variant="outline"
      value={value.map(String)}
      onValueChange={(vals) => onChange(vals.map(Number).sort())}
      disabled={disabled}
      aria-label="Hari operasional"
      className="w-full"
    >
      {WEEKDAYS.map((day) => (
        <ToggleGroupItem key={day.value} value={String(day.value)} className="flex-1">
          {day.label}
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  );
}

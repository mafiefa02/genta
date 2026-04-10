import { Button } from "-/components/ui/button";

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
  const toggle = (day: number) => {
    onChange(value.includes(day) ? value.filter((d) => d !== day) : [...value, day].sort());
  };

  return (
    <div role="group" aria-label="Hari operasional" className="flex gap-1.5">
      {WEEKDAYS.map((day) => (
        <Button
          key={day.value}
          type="button"
          size="sm"
          variant={value.includes(day.value) ? "default" : "outline"}
          onClick={() => toggle(day.value)}
          disabled={disabled}
          className="min-w-9 flex-1"
        >
          {day.label}
        </Button>
      ))}
    </div>
  );
}

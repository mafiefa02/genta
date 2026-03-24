import { Button } from "@shared/components/ui/button";
import { cn } from "@shared/lib/utils";
import { useCallback } from "react";
import { useDateContext } from "../contexts/date-context";

const DAY_LABELS: Record<number, string> = {
  1: "Mon",
  2: "Tue",
  3: "Wed",
  4: "Thu",
  5: "Fri",
  6: "Sat",
  7: "Sun",
};

export const DateSelector = () => {
  const { selectedDay, setSelectedDay, businessDays } = useDateContext();

  return (
    <div className="flex w-full items-center gap-1">
      {businessDays.map((day) => (
        <DayTab
          key={day}
          day={day}
          label={DAY_LABELS[day]}
          isActive={selectedDay === day}
          onSelect={setSelectedDay}
        />
      ))}
    </div>
  );
};

const DayTab = ({
  day,
  label,
  isActive,
  onSelect,
}: {
  day: number;
  label: string;
  isActive: boolean;
  onSelect: (day: number) => void;
}) => {
  const handleClick = useCallback(() => onSelect(day), [onSelect, day]);

  return (
    <Button
      variant={isActive ? "default" : "outline"}
      size="sm"
      className={cn("flex-1", !isActive && "text-muted-foreground")}
      onClick={handleClick}
    >
      {label}
    </Button>
  );
};

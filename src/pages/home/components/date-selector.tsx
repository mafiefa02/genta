import { Button } from "@shared/components/ui/button";
import { cn, ISO_DAY_LABELS } from "@shared/lib/utils";
import { useCallback } from "react";
import { useDateContext } from "../contexts/date-context";

export const DateSelector = () => {
  const { selectedDay, setSelectedDay, businessDays } = useDateContext();

  return (
    <div className="flex w-full items-center gap-1">
      {businessDays.map((day) => (
        <DayTab
          key={day}
          day={day}
          label={ISO_DAY_LABELS[day]}
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

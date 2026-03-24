import { Checkbox } from "@shared/components/ui/checkbox";
import { useCallback } from "react";
import { scheduleFormContext } from "../context";

type RepeatType = "once" | "weekly";

export const RepeatField = () => {
  const field = scheduleFormContext.useFieldContext<RepeatType>();
  const isOnce = field.state.value === "once";

  const handleToggle = useCallback(() => {
    field.handleChange(isOnce ? "weekly" : "once");
  }, [field, isOnce]);

  return (
    <div
      onClick={handleToggle}
      className="flex cursor-pointer flex-row items-start justify-between gap-2 rounded-lg border p-3 hover:bg-accent/50 has-data-checked:bg-accent/50"
      data-checked={isOnce || undefined}
    >
      <div className="pointer-events-none flex flex-col gap-1">
        <span className="text-sm font-medium">Play once</span>
        <span className="text-xs text-muted-foreground">
          Play this schedule only once on a specific date.
        </span>
      </div>
      <Checkbox
        checked={isOnce}
        onCheckedChange={(checked) =>
          field.handleChange(checked ? "once" : "weekly")
        }
        onClick={(e) => e.stopPropagation()}
      />
    </div>
  );
};

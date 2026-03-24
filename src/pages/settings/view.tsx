import { useBusinessDays } from "@features/profiles/hooks";
import { Badge } from "@shared/components/ui/badge";
import { Button } from "@shared/components/ui/button";
import { Card, CardContent } from "@shared/components/ui/card";
import {
  Field,
  FieldDescription,
  FieldLabel,
} from "@shared/components/ui/field";
import { cn } from "@shared/lib/utils";
import { services } from "@shared/lib/services";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { RotateCcwIcon, SaveIcon } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

const DAY_LABELS: Record<number, string> = {
  1: "Mon",
  2: "Tue",
  3: "Wed",
  4: "Thu",
  5: "Fri",
  6: "Sat",
  7: "Sun",
};

export const Settings = () => {
  const businessDays = useBusinessDays();
  const queryClient = useQueryClient();

  const { data: activeProfileId } = useQuery(
    services.config.get("active_profile"),
  );

  const [localBusinessDays, setLocalBusinessDays] =
    useState<number[]>(businessDays);

  useEffect(() => {
    setLocalBusinessDays(businessDays);
  }, [businessDays]);

  const businessDaysChanged = useMemo(() => {
    if (localBusinessDays.length !== businessDays.length) return true;
    return !localBusinessDays.every((d) => businessDays.includes(d));
  }, [localBusinessDays, businessDays]);

  const hasChanges = businessDaysChanged;

  const { mutate, isPending } = useMutation({
    ...services.profile.mutation.updateBusinessDays,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["business-days"] });
      queryClient.invalidateQueries({ queryKey: ["profiles"] });
    },
  });

  const handleSave = useCallback(() => {
    if (!activeProfileId) return;
    mutate({ profileId: activeProfileId, businessDays: localBusinessDays });
  }, [activeProfileId, localBusinessDays, mutate]);

  const handleResetAll = useCallback(() => {
    setLocalBusinessDays(businessDays);
  }, [businessDays]);

  const handleBusinessDayToggle = useCallback((day: number) => {
    setLocalBusinessDays((prev) => {
      const next = prev.includes(day)
        ? prev.filter((d) => d !== day)
        : [...prev, day].sort((a, b) => a - b);
      return next.length > 0 ? next : prev;
    });
  }, []);

  const handleResetBusinessDays = useCallback(() => {
    setLocalBusinessDays(businessDays);
  }, [businessDays]);

  return (
    <div className="flex w-full flex-1 flex-col gap-3">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold">Settings</h1>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            disabled={!hasChanges}
            onClick={handleResetAll}
          >
            <RotateCcwIcon className="size-4" />
            Reset
          </Button>
          <Button disabled={!hasChanges || isPending} onClick={handleSave}>
            <SaveIcon className="size-4" />
            Save
          </Button>
        </div>
      </div>

      <Card>
        <CardContent>
          <Field>
            <div className="flex items-center gap-2">
              <FieldLabel className="text-base font-semibold">
                Business Days
              </FieldLabel>
              {businessDaysChanged && (
                <>
                  <Badge variant="outline" className="text-xs">
                    Changed
                  </Badge>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-6"
                    onClick={handleResetBusinessDays}
                  >
                    <RotateCcwIcon className="size-3" />
                  </Button>
                </>
              )}
            </div>
            <FieldDescription>
              Select which days are working days. Only these days will appear in
              the schedule view and form.
            </FieldDescription>
            <div className="mt-2 flex items-center gap-1">
              {[1, 2, 3, 4, 5, 6, 7].map((day) => (
                <Button
                  key={day}
                  variant={
                    localBusinessDays.includes(day) ? "default" : "outline"
                  }
                  size="sm"
                  className={cn(
                    "flex-1",
                    !localBusinessDays.includes(day) &&
                      "text-muted-foreground",
                  )}
                  onClick={() => handleBusinessDayToggle(day)}
                >
                  {DAY_LABELS[day]}
                </Button>
              ))}
            </div>
          </Field>
        </CardContent>
      </Card>
    </div>
  );
};

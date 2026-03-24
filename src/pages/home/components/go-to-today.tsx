import { Button } from "@shared/components/ui/button";
import { getISODay } from "date-fns";
import { useCallback } from "react";
import { useDateContext } from "../contexts/date-context";

export const GoToToday = () => {
  const { selectedDay, setSelectedDay, businessDays } = useDateContext();

  const todayDay = getISODay(new Date());
  const isTodaySelected = selectedDay === todayDay;
  const isTodayBusinessDay = businessDays.includes(todayDay);

  const handleGoToToday = useCallback(
    () => setSelectedDay(todayDay),
    [setSelectedDay, todayDay],
  );

  if (isTodaySelected || !isTodayBusinessDay) return null;

  return (
    <Button
      variant="link"
      className="-mb-1 text-sm leading-0 font-light"
      size="sm"
      onClick={handleGoToToday}
    >
      Go to Today
    </Button>
  );
};

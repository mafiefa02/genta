import { useBusinessDays } from "@features/profiles/hooks";
import { getNextOccurrence } from "@shared/lib/utils";
import { getISODay } from "date-fns";
import { useCallback, useMemo, useState } from "react";
import { DateContext } from "../contexts/date-context";

export const DateProvider = ({
  children,
}: Readonly<{ children: React.ReactNode }>) => {
  const businessDays = useBusinessDays();

  const [selectedDay, setSelectedDayRaw] = useState(() => {
    const today = getISODay(new Date());
    return businessDays.includes(today) ? today : businessDays[0] ?? 1;
  });

  const date = useMemo(
    () => getNextOccurrence([selectedDay]),
    [selectedDay],
  );

  const setSelectedDay = useCallback((day: number) => {
    setSelectedDayRaw(day);
  }, []);

  const value = useMemo(
    () => ({ selectedDay, setSelectedDay, date, businessDays }),
    [selectedDay, setSelectedDay, date, businessDays],
  );

  return <DateContext.Provider value={value}>{children}</DateContext.Provider>;
};

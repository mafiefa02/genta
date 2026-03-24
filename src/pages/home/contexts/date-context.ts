import { createContext, useContext } from "react";

type DateContextType = {
  selectedDay: number; // ISO day of week (1=Mon, 7=Sun)
  setSelectedDay: (day: number) => void;
  date: Date; // Derived: next occurrence of selectedDay
  businessDays: number[];
};

export const DateContext = createContext<DateContextType | undefined>(
  undefined,
);

export const useDateContext = () => {
  const context = useContext(DateContext);

  if (!context) {
    throw new Error("useDateContext must be used within DateProvider");
  }

  return context;
};

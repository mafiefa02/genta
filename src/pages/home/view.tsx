import { DateProvider } from "./components/date-provider";
import { DateSelector } from "./components/date-selector";
import { GoToToday } from "./components/go-to-today";
import { ScheduleList } from "./components/schedule-list";
import { AddNewScheduleButton } from "./components/schedule/add-button";
import { SearchProvider } from "./components/search-provider";
import { SearchSchedules } from "./components/search-schedules";

export const Home = () => {
  return (
    <div className="flex w-full flex-1 flex-col gap-3">
      <DateProvider>
        <div className="flex items-center gap-1">
          <h1 className="text-2xl font-semibold">Schedules</h1>
          <GoToToday />
        </div>
        <DateSelector />

        <SearchProvider>
          <div className="flex items-center gap-2">
            <SearchSchedules />
            <AddNewScheduleButton />
          </div>

          <ScheduleList />
        </SearchProvider>
      </DateProvider>
    </div>
  );
};

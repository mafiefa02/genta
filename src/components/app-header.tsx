import { useEffect, useRef, useState } from "react";

import { SidebarTrigger } from "./ui/sidebar";

export const AppHeader = () => {
  return (
    <header className="sticky top-0 flex items-center justify-between border-b bg-sidebar px-4 py-2">
      <div className="mx-auto flex flex-1 justify-between">
        <div className="flex items-center gap-2">
          <SidebarTrigger variant="outline" />
          <span className="text-lg font-semibold tracking-tight">Genta</span>
        </div>
        <CurrentLocalTime />
      </div>
    </header>
  );
};

const timeFormatter = new Intl.DateTimeFormat("id-ID", {
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hour12: false,
  timeZoneName: "short",
});

const CurrentLocalTime = () => {
  const [time, setTime] = useState(() => timeFormatter.format(new Date()));
  const rafId = useRef(0);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    const tick = () => {
      const now = new Date();
      setTime(timeFormatter.format(now));
      timer = setTimeout(tick, 1000 - now.getMilliseconds());
    };
    timer = setTimeout(tick, 1000 - new Date().getMilliseconds());
    return () => {
      clearTimeout(timer);
      cancelAnimationFrame(rafId.current);
    };
  }, []);

  return (
    <div className="grid gap-0 text-right text-xs leading-none">
      <span className="font-medium">Waktu Lokal</span>
      <span className="text-muted-foreground tabular-nums">{time}</span>
    </div>
  );
};

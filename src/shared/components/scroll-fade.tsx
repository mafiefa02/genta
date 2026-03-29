import { cn } from "@shared/lib/utils";
import { useEffect, useRef, useState } from "react";

export const ScrollFade = ({
  className,
  children,
  ...props
}: React.ComponentProps<"div">) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [scrollState, setScrollState] = useState({
    canScrollUp: false,
    canScrollDown: false,
  });

  useEffect(() => {
    const element = scrollRef.current;
    if (!element) return;

    const updateScrollState = () => {
      const { scrollTop, scrollHeight, clientHeight } = element;
      const newCanScrollUp = scrollTop > 0;
      const newCanScrollDown = scrollTop + clientHeight < scrollHeight - 1;

      setScrollState((prev) => {
        if (
          prev.canScrollUp === newCanScrollUp &&
          prev.canScrollDown === newCanScrollDown
        ) {
          return prev;
        }
        return {
          canScrollUp: newCanScrollUp,
          canScrollDown: newCanScrollDown,
        };
      });
    };

    updateScrollState();

    let rafId: number;
    const handleScroll = () => {
      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(updateScrollState);
    };

    element.addEventListener("scroll", handleScroll, { passive: true });

    const observer = new ResizeObserver(() => updateScrollState());
    observer.observe(element);

    return () => {
      element.removeEventListener("scroll", handleScroll);
      observer.disconnect();
      cancelAnimationFrame(rafId);
    };
  }, []);

  return (
    <div
      ref={scrollRef}
      className={cn("relative overflow-y-auto overscroll-contain", className)}
      {...props}
    >
      <div
        className={cn(
          "pointer-events-none sticky top-0 z-10 -mb-22 h-22 w-full transition-opacity duration-300",
          "bg-linear-to-b from-background to-transparent",
          scrollState.canScrollUp ? "opacity-100" : "opacity-0",
        )}
      />

      {children}

      <div
        className={cn(
          "pointer-events-none sticky bottom-0 z-10 -mt-22 h-22 w-full transition-opacity duration-300",
          "bg-linear-to-t from-background to-transparent",
          scrollState.canScrollDown ? "opacity-100" : "opacity-0",
        )}
      />
    </div>
  );
};

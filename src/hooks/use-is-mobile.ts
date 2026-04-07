import { useState, useEffect } from "react";

const DEFAULT_MOBILE_BREAKPOINT = 768;

/**
 * Tracks whether the viewport width is below a given breakpoint.
 *
 * @param mobileBreakpoint - Width threshold in pixels (default: 768).
 * @returns `true` if the viewport is narrower than the breakpoint, `false` otherwise.
 */
export function useIsMobile(mobileBreakpoint: number = DEFAULT_MOBILE_BREAKPOINT) {
  const [isMobile, setIsMobile] = useState<boolean | undefined>(undefined);

  useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${mobileBreakpoint - 1}px)`);
    const onChange = () => {
      setIsMobile(window.innerWidth < mobileBreakpoint);
    };
    mql.addEventListener("change", onChange);
    setIsMobile(window.innerWidth < mobileBreakpoint);
    return () => mql.removeEventListener("change", onChange);
  }, []);

  return !!isMobile;
}

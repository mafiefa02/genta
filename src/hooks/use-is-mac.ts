/**
 * Detects whether the user's device is running macOS.
 *
 * @returns `true` if the user agent string contains "Mac", `false` otherwise.
 */
export const useIsMac = () => {
  return navigator.userAgent.includes("Mac");
};

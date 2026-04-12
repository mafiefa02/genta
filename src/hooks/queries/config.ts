import { getConfig } from "-/lib/config-store";
import { queryOptions, type QueryObserverOptions } from "@tanstack/react-query";

/** Options for configuration queries, excluding internal TanStack Query keys. */
type QueryOptions<TData> = Omit<QueryObserverOptions<TData>, "queryKey" | "queryFn">;

/** Queries for retrieving application configuration. */
export const configQueries = {
  /** Query key factory for configuration settings. */
  keys: {
    /** Root key for all configuration queries. */
    all: ["config"] as const,
    /** Key for a specific configuration setting. */
    key: (key: string) => ["config", key] as const,
  },

  /**
   * Retrieves the ID of the currently active schedule preset.
   *
   * @param options - Query options.
   */
  activePresetId: (options?: QueryOptions<number | null>) =>
    queryOptions({
      queryKey: configQueries.keys.key("activePresetId"),
      queryFn: () => getConfig("activePresetId"),
      ...options,
    }),
};

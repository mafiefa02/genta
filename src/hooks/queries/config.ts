import { getConfig } from "-/lib/config-store";
import { queryOptions, type QueryObserverOptions } from "@tanstack/react-query";

type QueryOptions<TData> = Omit<QueryObserverOptions<TData>, "queryKey" | "queryFn">;

export const configQueries = {
  keys: {
    all: ["config"] as const,
    key: (key: string) => ["config", key] as const,
  },

  activePresetId: (options?: QueryOptions<number | null>) =>
    queryOptions({
      queryKey: configQueries.keys.key("activePresetId"),
      queryFn: () => getConfig("activePresetId"),
      ...options,
    }),
};

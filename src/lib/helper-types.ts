import { QueryObserverOptions, UseMutationOptions } from "@tanstack/react-query";

export type HelperMutationOptions<TData, TVariables> = Omit<
  UseMutationOptions<TData, Error, TVariables>,
  "mutationKey" | "mutationFn"
>;

export type HelperQueryOptions<TData> = Omit<QueryObserverOptions<TData>, "queryKey" | "queryFn">;

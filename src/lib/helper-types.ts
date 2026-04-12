import { QueryObserverOptions, UseMutationOptions } from "@tanstack/react-query";

/**
 * Standard mutation options with pre-defined keys and functions excluded.
 * 
 * @template TData - The expected data returned from the mutation.
 * @template TVariables - The variables passed to the mutation function.
 */
export type HelperMutationOptions<TData, TVariables> = Omit<
  UseMutationOptions<TData, Error, TVariables>,
  "mutationKey" | "mutationFn"
>;

/**
 * Standard query options with pre-defined keys and functions excluded.
 * 
 * @template TData - The expected data returned from the query.
 */
export type HelperQueryOptions<TData> = Omit<QueryObserverOptions<TData>, "queryKey" | "queryFn">;

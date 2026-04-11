import type { CustomSound } from "-/lib/models";

import { getDb } from "-/lib/db";
import { HelperQueryOptions } from "-/lib/helper-types";
import { queryOptions } from "@tanstack/react-query";

export const soundsQueries = {
  keys: {
    all: ["sounds"] as const,
  },

  list: (options?: HelperQueryOptions<CustomSound[]>) =>
    queryOptions({
      queryKey: soundsQueries.keys.all,
      queryFn: async () => {
        const db = await getDb();
        return (await db.select(
          "SELECT * FROM custom_sound ORDER BY label, file_path",
        )) as CustomSound[];
      },
      ...options,
    }),
};

import {
  Select,
  SelectGroup,
  SelectGroupLabel,
  SelectItem,
  SelectPopup,
  SelectTrigger,
  SelectValue,
} from "@shared/components/ui/select";
import { Skeleton } from "@shared/components/ui/skeleton";
import { repositories } from "@shared/lib/repositories";
import { services } from "@shared/lib/services";
import { useMutation, useQueries, useQueryClient } from "@tanstack/react-query";
import { InferResult } from "kysely";
import { CalendarIcon } from "lucide-react";
import { useCallback } from "react";

const LoadingState = () => <Skeleton className="h-8 w-full max-w-32" />;

export const GlobalProfileSelector = () => {
  const queryClient = useQueryClient();
  const [profiles, activeProfile] = useQueries({
    queries: [
      {
        ...services.profile.query.getProfiles(),
        select: (
          data: InferResult<ReturnType<typeof repositories.profile.findAll>>,
        ) =>
          data.map((profile) => ({ label: profile.name, value: profile.id })),
      },
      services.config.get("active_profile"),
    ],
  });

  const changeProfile = useMutation({
    ...services.config.set("active_profile"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["config", "active_profile"] });
      queryClient.invalidateQueries({ queryKey: ["schedules"] });
    },
  });

  const handleChange = useCallback(
    (value: number | null) => {
      if (value) return changeProfile.mutate(value);
    },
    [changeProfile],
  );

  if (profiles.isPending || activeProfile.isPending) return <LoadingState />;

  if (profiles.isError) return <p>{profiles.error.message}</p>;
  if (activeProfile.isError) return <p>{activeProfile.error.message}</p>;

  return (
    <Select
      items={profiles.data}
      onValueChange={handleChange}
      value={activeProfile.data}
    >
      <SelectTrigger>
        <CalendarIcon />
        <SelectValue />
      </SelectTrigger>
      <SelectPopup>
        <SelectGroup>
          <SelectGroupLabel>Profiles</SelectGroupLabel>
          {profiles.data.map((profile) => (
            <SelectItem
              key={profile.value}
              value={profile.value}
            >
              {profile.label}
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectPopup>
    </Select>
  );
};

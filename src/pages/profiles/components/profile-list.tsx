import { NoDataIllustration } from "@shared/components/illustrations/no-data";
import { WarningIllustration } from "@shared/components/illustrations/warning";
import { Badge } from "@shared/components/ui/badge";
import { Button } from "@shared/components/ui/button";
import { Card, CardContent } from "@shared/components/ui/card";
import {
  Dialog,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogPopup,
  DialogTitle,
} from "@shared/components/ui/dialog";
import { Skeleton } from "@shared/components/ui/skeleton";
import { useDebounce } from "@shared/lib/hooks";
import { services } from "@shared/lib/services";
import { cn } from "@shared/lib/utils";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { TrashIcon } from "lucide-react";
import { useState } from "react";
import { useSearchContext } from "../contexts/search-context";
import { ProfileEditButton } from "./profile-edit-button";

export const ProfileList = ({
  className,
  ...props
}: React.ComponentProps<"div">) => {
  const { search } = useSearchContext();
  const debouncedSearch = useDebounce(search, 250);

  const { data, isPending, isError, error } = useQuery(
    services.profile.query.getProfiles({
      search: debouncedSearch,
    }),
  );

  const activeProfile = useQuery(services.config.get("active_profile"));

  if (isPending || activeProfile.isPending) return <ProfileListPending />;
  if (isError) return <ProfileListError error={error.message} />;
  if (data.length === 0) return <ProfileListEmpty />;

  const [deletingProfile, setDeletingProfile] = useState<{
    id: number;
    scheduleCount: number;
  } | null>(null);

  return (
    <>
      <div
        className={cn("flex flex-col gap-3", className)}
        {...props}
      >
        {data.map((profile) => (
          <ProfileListItem
            key={profile.id}
            id={profile.id}
            name={profile.name}
            scheduleCount={Number(profile.schedule_count)}
            isActive={profile.id === activeProfile.data}
            onDelete={() =>
              setDeletingProfile({
                id: profile.id,
                scheduleCount: Number(profile.schedule_count),
              })
            }
          />
        ))}
      </div>
      <ProfileDeleteDialog
        data={deletingProfile}
        onOpenChange={(open) => !open && setDeletingProfile(null)}
      />
    </>
  );
};

const ProfileListItem = ({
  id,
  name,
  scheduleCount,
  isActive,
  onDelete,
}: {
  id: number;
  name: string;
  scheduleCount: number;
  isActive: boolean;
  onDelete: () => void;
}) => {
  return (
    <Card className="group">
      <CardContent className="relative flex items-center gap-4">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <h1 className="font-semibold">{name}</h1>
            {isActive && (
              <Badge
                variant="info"
                size="sm"
              >
                Active
              </Badge>
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            {scheduleCount} {scheduleCount === 1 ? "schedule" : "schedules"}
          </p>
        </div>
        <div className="absolute right-0 hidden h-full items-center gap-3 bg-card mask-[linear-gradient(to_right,transparent,theme(--color-card)_2rem)] pr-4 pl-10 group-hover:flex [&_svg]:size-4!">
          <ProfileEditButton
            id={id}
            initialName={name}
          />
          {!isActive && (
            <Button
              variant="destructive-outline"
              size="icon"
              onClick={onDelete}
            >
              <TrashIcon />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

const ProfileDeleteDialog = ({
  data,
  onOpenChange,
}: {
  data: { id: number; scheduleCount: number } | null;
  onOpenChange: (open: boolean) => void;
}) => {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    ...services.profile.mutation.deleteProfile,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profiles"] });
      onOpenChange(false);
    },
  });

  return (
    <Dialog open={data !== null} onOpenChange={onOpenChange}>
      <DialogPopup>
        <DialogHeader>
          <DialogTitle>Are you sure?</DialogTitle>
          <DialogDescription>
            You are about to delete this profile. This will also delete{" "}
            <strong className="text-foreground">
              {data?.scheduleCount ?? 0}
            </strong>{" "}
            schedule
            {data?.scheduleCount === 1 ? "" : "s"} tied to it.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button
            onClick={() => {
              if (data) mutation.mutate(data.id);
            }}
            variant="destructive"
          >
            Delete
          </Button>
        </DialogFooter>
      </DialogPopup>
    </Dialog>
  );
};

const ProfileListPending = ({
  className,
  ...props
}: React.ComponentProps<"div">) => {
  const [skeletonCount] = useState(() => Math.floor(Math.random() * 4) + 3);
  return (
    <div
      className={cn("flex flex-1 flex-col gap-3", className)}
      {...props}
    >
      {Array.from({ length: skeletonCount }).map((_, i) => (
        <Skeleton
          key={`skeleton-${i}`}
          className="h-24 w-full rounded-2xl"
        />
      ))}
    </div>
  );
};

const ProfileListError = ({
  className,
  error,
  ...props
}: React.ComponentProps<"div"> & { error: string }) => {
  return (
    <div
      className={cn(
        "flex flex-1 flex-col items-center justify-center gap-4 px-8",
        className,
      )}
      {...props}
    >
      <WarningIllustration className="size-40" />
      <div className="flex max-w-[60ch] flex-col gap-1 text-center">
        <h1 className="text-xl font-semibold">Oops! Something went wrong</h1>
        <h3 className="text-balance text-muted-foreground">{error}</h3>
      </div>
    </div>
  );
};

const ProfileListEmpty = ({
  className,
  ...props
}: React.ComponentProps<"div">) => {
  return (
    <div
      className={cn(
        "flex flex-1 flex-col items-center justify-center gap-4 px-8",
        className,
      )}
      {...props}
    >
      <NoDataIllustration className="size-40" />
      <div className="flex max-w-[60ch] flex-col gap-1 text-center">
        <h1 className="text-xl font-semibold">No Data Found</h1>
        <h3 className="text-balance text-muted-foreground">
          Looks like we couldn&apos;t find what you&apos;re looking for.
        </h3>
      </div>
    </div>
  );
};

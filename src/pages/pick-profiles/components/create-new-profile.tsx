import { profileFormHook } from "@features/profiles/components/forms/hook";
import { AddNewProfileForm } from "@pages/profiles/components/add-new-profile-form";
import { profileFormOpts } from "@pages/profiles/components/add-new-profile-form-options";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@shared/components/ui/alert";
import { Button, ButtonProps } from "@shared/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogPanel,
  DialogPopup,
  DialogTitle,
  DialogTrigger,
} from "@shared/components/ui/dialog";
import { services } from "@shared/lib/services";
import { cn } from "@shared/lib/utils";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { CircleAlertIcon, Loader2Icon, PlusIcon } from "lucide-react";
import { useCallback } from "react";
import { useNavigate } from "react-router";

export const CreateNewProfile = ({ className, ...props }: ButtonProps) => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { mutate, isPending, isError, error } = useMutation(
    services.profile.mutation.insertProfile,
  );

  const form = profileFormHook.useAppForm({
    ...profileFormOpts,
    onSubmit: async ({ value }) => {
      await new Promise<void>((resolve, reject) => {
        mutate(
          {
            name: value["profile-name"],
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          },
          {
            onSuccess: () => {
              queryClient.invalidateQueries({ queryKey: ["profiles"] });
              queryClient.invalidateQueries({
                queryKey: ["config", "active_profile"],
              });
              navigate("/");
              resolve();
            },
            onError: (err) => {
              reject(err);
            },
          },
        );
      });
    },
  });

  const handleOpenChange = useCallback(
    (open: boolean) => {
      if (!open) {
        form.reset();
      }
    },
    [form],
  );

  return (
    <Dialog onOpenChange={handleOpenChange}>
      <DialogTrigger
        render={
          <Button
            variant="outline"
            className={cn(
              "w-full text-center text-muted-foreground transition-colors hover:text-foreground",
              className,
            )}
            {...props}
          />
        }
      >
        <PlusIcon />
        <p>Create new profile</p>
      </DialogTrigger>

      <DialogPopup>
        <DialogHeader>
          <DialogTitle>Create a new profile</DialogTitle>
          <DialogDescription>
            This profile will be used to determine your schedules.
          </DialogDescription>
        </DialogHeader>

        <DialogPanel>
          {isError && (
            <Alert
              className="text-xs"
              variant="error"
            >
              <CircleAlertIcon />
              <AlertTitle>Something went wrong!</AlertTitle>
              <AlertDescription>{error.message}</AlertDescription>
            </Alert>
          )}

          <AddNewProfileForm form={form} />
        </DialogPanel>

        <DialogFooter>
          <DialogClose render={<Button variant="ghost" />}>Cancel</DialogClose>
          <form.AppForm>
            <form.SubmitButton size={isPending ? "icon" : "default"}>
              {isPending ? (
                <Loader2Icon className="animate-spin" />
              ) : (
                <p>Create</p>
              )}
            </form.SubmitButton>
          </form.AppForm>
        </DialogFooter>
      </DialogPopup>
    </Dialog>
  );
};

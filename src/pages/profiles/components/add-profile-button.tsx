import { profileFormHook } from "@features/profiles/components/forms/hook";
import { Button } from "@shared/components/ui/button";
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
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { PlusIcon } from "lucide-react";
import { useCallback, useState } from "react";
import { AddNewProfileForm } from "./add-new-profile-form";
import { profileFormOpts } from "./add-new-profile-form-options";

export const AddProfileButton = () => {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();

  const { mutate } = useMutation(services.profile.mutation.insertProfile);

  const profileForm = profileFormHook.useAppForm({
    ...profileFormOpts,
    onSubmit: ({ value }) => {
      mutate(
        {
          name: value["profile-name"],
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        },
        {
          onSuccess: () => {
            setOpen(false);
            queryClient.invalidateQueries({ queryKey: ["profiles"] });
            queryClient.invalidateQueries({
              queryKey: ["config", "active_profile"],
            });
          },
        },
      );
    },
  });

  const handleFormReset = useCallback(
    (open: boolean) => {
      if (!open) {
        profileForm.reset();
      }
    },
    [profileForm],
  );

  return (
    <Dialog
      open={open}
      onOpenChange={setOpen}
      onOpenChangeComplete={handleFormReset}
    >
      <DialogTrigger
        render={
          <Button
            size="icon"
          />
        }
      >
        <PlusIcon />
      </DialogTrigger>
      <DialogPopup>
        <DialogHeader>
          <DialogTitle>Create Profile</DialogTitle>
          <DialogDescription>
            Create a new profile to manage schedules.
          </DialogDescription>
        </DialogHeader>
        <DialogPanel>
          <AddNewProfileForm form={profileForm} />
        </DialogPanel>
        <DialogFooter className="flex items-center gap-2">
          <DialogClose render={<Button variant="ghost" />}>Cancel</DialogClose>
          <profileForm.AppForm>
            <profileForm.SubmitButton>Create</profileForm.SubmitButton>
          </profileForm.AppForm>
        </DialogFooter>
      </DialogPopup>
    </Dialog>
  );
};
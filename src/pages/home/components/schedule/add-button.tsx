import { scheduleFormHook } from "@features/schedules/components/forms/hook";
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
import { formatDate, getNextOccurrence } from "@shared/lib/utils";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { PlusIcon } from "lucide-react";
import { useCallback, useState } from "react";
import { useDateContext } from "../../contexts/date-context";
import { AddNewScheduleForm } from "./add-new-form";
import { scheduleFormOpts } from "./add-new-form-options";

export const AddNewScheduleButton = (props: ButtonProps) => {
  const [open, setOpen] = useState(false);
  const { selectedDay } = useDateContext();

  const { mutate } = useMutation(
    services.schedule.mutation.insertSchedule({ profileId: "currentProfile" }),
  );

  const queryClient = useQueryClient();
  const scheduleForm = scheduleFormHook.useAppForm({
    ...scheduleFormOpts,
    defaultValues: {
      ...scheduleFormOpts.defaultValues,
      days: [selectedDay],
      startDate: getNextOccurrence([selectedDay]),
    },
    onSubmit: ({ value }) =>
      mutate(
        {
          name: value.name,
          sound_id: value.sound,
          start_date: formatDate(value.startDate),
          time: value.time,
          end_date: value.endDate ? formatDate(value.endDate) : undefined,
          repeat: value.repeat,
          days: value.days,
        },
        {
          onSuccess: () => {
            setOpen(false);
            queryClient.invalidateQueries({ queryKey: ["schedules"] });
          },
          onError: (e) => console.error(e.message),
        },
      ),
  });

  const handleFormReset = useCallback(
    (open: boolean) => {
      if (!open) {
        scheduleForm.reset();
      }
    },
    [scheduleForm],
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
            {...props}
          />
        }
      >
        <PlusIcon />
      </DialogTrigger>
      <DialogPopup>
        <DialogHeader>
          <DialogTitle>Add New Schedule</DialogTitle>
          <DialogDescription>
            Provide a detailed information about this new schedule
          </DialogDescription>
        </DialogHeader>
        <DialogPanel>
          <AddNewScheduleForm form={scheduleForm} />
        </DialogPanel>
        <DialogFooter className="flex items-center gap-2">
          <DialogClose render={<Button variant="ghost" />}>Cancel</DialogClose>
          <scheduleForm.AppForm>
            <scheduleForm.SubmitButton>Create</scheduleForm.SubmitButton>
          </scheduleForm.AppForm>
        </DialogFooter>
      </DialogPopup>
    </Dialog>
  );
};

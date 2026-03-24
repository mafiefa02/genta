import { getNextOccurrence, timeToMinutes } from "@shared/lib/utils";
import { formOptions } from "@tanstack/react-form";
import { format, getISODay } from "date-fns";
import { minutesInDay } from "date-fns/constants";
import z from "zod";

const repeatType = z.union([z.literal("once"), z.literal("weekly")]);

export const schema = z
  .object({
    name: z
      .string({ error: "Name is supposed to be of type string." })
      .min(1, { error: "Please provide a schedule name!" }),
    startDate: z
      .date({ error: "Start date is required!" })
      .nonoptional({ error: "Start date is required!" }),
    endDate: z
      .date({ error: "End date is required!" })
      .min(new Date(), { error: "End date can't be earlier than today!" })
      .nullable(),
    time: z
      .number({ error: "Time format is invalid!" })
      .positive({ error: "Please provide a valid time!" })
      .max(minutesInDay, { error: "Time is invalid!" })
      .nonoptional(),
    days: z.array(
      z
        .number({ error: "Please provide a valid day!" })
        .min(1, { error: "Please provide a valid day!" })
        .max(7, { error: "Please provide a valid day!" }),
    ),
    repeat: repeatType.nonoptional({ error: "Please provide a repeat type!" }),
    sound: z.number({ error: "Sound is invalid!" }).nullable(),
  })
  .refine((v) => (v.endDate ? v.endDate >= v.startDate : true), {
    error: "End date has to be later than start date!",
    path: ["endDate"],
    abort: true,
  })
  .refine((v) => (v.repeat === "weekly" ? v.days.length >= 1 : true), {
    error: "Please select at least one repeat day!",
    path: ["days"],
    abort: true,
  });

const defaultDays = [getISODay(new Date())];

export const scheduleFormOpts = formOptions({
  defaultValues: {
    name: "",
    startDate: getNextOccurrence(defaultDays),
    endDate: null as Date | null,
    time: timeToMinutes(format(new Date(), "HH:mm")) as number,
    repeat: "weekly" as z.infer<typeof repeatType>,
    days: defaultDays,
    sound: null as number | null,
  },
  validators: { onSubmit: schema },
});

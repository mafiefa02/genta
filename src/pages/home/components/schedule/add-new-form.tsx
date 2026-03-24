import { scheduleFormHook } from "@features/schedules/components/forms/hook";
import { FormFieldError } from "@shared/components/form-field-error";
import { useRef } from "react";
import { scheduleFormOpts } from "./add-new-form-options";

export const AddNewScheduleForm = scheduleFormHook.withForm({
  ...scheduleFormOpts,
  render: ({ form }) => {
    const savedDaysRef = useRef<number[]>([]);

    return (
      <div className="flex flex-col gap-4">
        <form.AppField
          name="name"
          children={(field) => (
            <field.TextField
              label="Schedule Name"
              placeholder="Enter the schedule name here..."
            />
          )}
        />
        <form.AppField
          name="time"
          children={(field) => <field.TimeField label="Time" />}
        />
        <form.AppField
          name="repeat"
          listeners={{
            onChange: ({ value, fieldApi }) => {
              if (value === "once") {
                savedDaysRef.current =
                  fieldApi.form.getFieldValue("days");
                fieldApi.form.setFieldValue("days", []);
                fieldApi.form.setFieldValue("startDate", new Date());
              } else {
                const restored =
                  savedDaysRef.current.length > 0
                    ? savedDaysRef.current
                    : fieldApi.form.options.defaultValues!.days;
                fieldApi.form.setFieldValue("days", restored);
                fieldApi.form.setFieldValue("startDate", new Date());
              }
            },
          }}
          children={(field) => <field.RepeatField />}
        />
        <form.Subscribe
          selector={(state) => state.values.repeat}
          children={(repeat) =>
            repeat === "once" ? (
              <form.AppField
                name="startDate"
                children={(field) => (
                  <field.DatePickerField
                    componentProps={{
                      popover: { side: "top", align: "start" },
                      label: { label: "Date" },
                      calendar: { mode: "single" },
                      trigger: { className: "w-full justify-start" },
                    }}
                  />
                )}
              />
            ) : (
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-3">
                  <form.AppField
                    name="startDate"
                    listeners={{
                      onChange: ({ fieldApi, value }) => {
                        const endDate =
                          fieldApi.form.getFieldValue("endDate");
                        if (endDate && value > endDate) {
                          fieldApi.form.resetField("endDate");
                        }
                      },
                    }}
                    children={(field) => (
                      <field.DatePickerField
                        withError={false}
                        componentProps={{
                          popover: { side: "top", align: "start" },
                          label: { label: "Start Date" },
                          calendar: { mode: "single" },
                          trigger: { className: "w-full justify-start" },
                        }}
                      />
                    )}
                  />
                  <form.AppField
                    name="endDate"
                    children={(field) => (
                      <field.DatePickerField
                        componentProps={{
                          popover: { side: "top", align: "start" },
                          label: { label: "End Date" },
                          calendar: { mode: "single" },
                          trigger: { className: "w-full justify-start" },
                        }}
                        withError={false}
                      />
                    )}
                  />
                </div>
                <p className="text-sm text-muted-foreground">
                  If no end date is set, the schedule repeats indefinitely.
                </p>
                <form.Subscribe
                  selector={(state) => state.fieldMeta.startDate}
                  children={(fieldMeta) => {
                    if (!fieldMeta) return null;
                    return (
                      <FormFieldError name="startDate" meta={fieldMeta} />
                    );
                  }}
                />
                <form.Subscribe
                  selector={(state) => state.fieldMeta.endDate}
                  children={(fieldMeta) => {
                    if (!fieldMeta) return null;
                    return (
                      <FormFieldError name="endDate" meta={fieldMeta} />
                    );
                  }}
                />
              </div>
            )
          }
        />
        <form.AppField
          name="sound"
          children={(field) => <field.SoundField label="Sound" />}
        />
      </div>
    );
  },
});

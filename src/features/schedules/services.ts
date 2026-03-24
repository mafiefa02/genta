import { FeatureServices } from "@models/service";
import { ScheduleOverrides, Schedules } from "@shared/lib/db";
import { handleThrowError } from "@shared/lib/utils";
import { mutationOptions, queryOptions } from "@tanstack/react-query";
import { Insertable, Selectable } from "kysely";
import { ScheduleRepository } from "./repository";

export class ScheduleServices extends FeatureServices<ScheduleRepository> {
  private async getSchedules(params: {
    profileId: Selectable<Schedules>["profile_id"];
    date: Selectable<ScheduleOverrides>["original_date"];
    search?: Selectable<Schedules>["name"];
  }) {
    const query = this.repository.findAll(params);
    try {
      return await query.execute();
    } catch (e) {
      return handleThrowError(e);
    }
  }

  private async getUpcomingOneTimeSchedules(params: {
    profileId: Selectable<Schedules>["profile_id"];
    search?: Selectable<Schedules>["name"];
  }) {
    try {
      return await this.repository.findUpcomingOneTime(params).execute();
    } catch (e) {
      return handleThrowError(e);
    }
  }

  private async createSchedule(
    params: { profileId: Schedules["profile_id"] | "currentProfile" },
    values: Omit<Insertable<Schedules>, "profile_id"> & { days: number[] },
  ) {
    try {
      const pid =
        params.profileId === "currentProfile"
          ? await this.config.get("active_profile")
          : params.profileId;

      if (!pid) throw new Error("No profile specified!");

      const schedule = await this.repository.insert({
        ...values,
        profile_id: pid,
      });

      return schedule;
    } catch (e) {
      return handleThrowError(e);
    }
  }

  private async deleteSchedule(
    params: Omit<Parameters<ScheduleRepository["delete"]>[0], "profileId">,
    profileId: Selectable<Schedules>["profile_id"] | "currentProfile",
  ) {
    try {
      const pid =
        profileId === "currentProfile"
          ? await this.config.get("active_profile")
          : profileId;

      if (!pid) throw new Error("No profile specified!");

      return await this.repository.delete({
        ...params,
        profileId: pid,
      });
    } catch (e) {
      return handleThrowError(e);
    }
  }

  private async updateSchedule(
    params: Omit<Parameters<ScheduleRepository["update"]>[0], "profileId">,
    profileId: Selectable<Schedules>["profile_id"] | "currentProfile",
  ) {
    try {
      const pid =
        profileId === "currentProfile"
          ? await this.config.get("active_profile")
          : profileId;

      if (!pid) throw new Error("No profile specified!");

      return await this.repository.update({
        ...params,
        profileId: pid,
      });
    } catch (e) {
      return handleThrowError(e);
    }
  }

  private async getScheduleDays(scheduleId: number) {
    try {
      const rows = await this.repository.findDays(scheduleId).execute();
      return rows.map((r) => r.day_of_week);
    } catch (e) {
      return handleThrowError(e);
    }
  }

  get query() {
    return {
      getSchedules: (params: {
        profileId: Selectable<Schedules>["profile_id"] | "currentProfile";
        date: Selectable<ScheduleOverrides>["original_date"];
        search?: Selectable<Schedules>["name"];
      }) => {
        return queryOptions({
          queryKey: ["schedules", params],
          queryFn: async () => {
            try {
              const pid =
                params.profileId === "currentProfile"
                  ? await this.config.get("active_profile")
                  : params.profileId;

              if (!pid) throw new Error("No profile specified!");

              const result = await this.getSchedules({
                ...params,
                profileId: pid,
              });

              return result;
            } catch (e) {
              return handleThrowError(e);
            }
          },
        });
      },
      getScheduleDays: (scheduleId: number) => {
        return queryOptions({
          queryKey: ["schedule-days", scheduleId],
          queryFn: () => this.getScheduleDays(scheduleId),
        });
      },
      getUpcomingOneTimeSchedules: (params: {
        profileId: Selectable<Schedules>["profile_id"] | "currentProfile";
        search?: Selectable<Schedules>["name"];
      }) => {
        return queryOptions({
          queryKey: ["schedules", "one-time", params],
          queryFn: async () => {
            try {
              const pid =
                params.profileId === "currentProfile"
                  ? await this.config.get("active_profile")
                  : params.profileId;

              if (!pid) throw new Error("No profile specified!");

              return await this.getUpcomingOneTimeSchedules({
                ...params,
                profileId: pid,
              });
            } catch (e) {
              return handleThrowError(e);
            }
          },
        });
      },
    };
  }

  get mutation() {
    return {
      insertSchedule: (params: {
        profileId: Schedules["profile_id"] | "currentProfile";
      }) =>
        mutationOptions({
          mutationKey: ["create-schedule", params],
          mutationFn: async (
            values: Omit<Insertable<Schedules>, "profile_id"> & {
              days: number[];
            },
          ) => this.createSchedule(params, values),
        }),
      deleteSchedule: (
        params: Omit<
          Parameters<ScheduleRepository["delete"]>[0],
          "profileId" | "deleteType"
        >,
        profileId:
          | Selectable<Schedules>["profile_id"]
          | "currentProfile" = "currentProfile",
      ) =>
        mutationOptions({
          mutationKey: ["delete-schedule", params],
          mutationFn: async (
            deleteType: Parameters<
              ScheduleRepository["delete"]
            >[0]["deleteType"],
          ) => this.deleteSchedule({ ...params, deleteType }, profileId),
        }),
      updateSchedule: (
        params: Omit<
          Parameters<ScheduleRepository["update"]>[0],
          "profileId" | "updateType" | "values"
        >,
        profileId:
          | Selectable<Schedules>["profile_id"]
          | "currentProfile" = "currentProfile",
      ) =>
        mutationOptions({
          mutationKey: ["update-schedule", params],
          mutationFn: async (args: {
            updateType: Parameters<
              ScheduleRepository["update"]
            >[0]["updateType"];
            values: Parameters<ScheduleRepository["update"]>[0]["values"];
          }) =>
            this.updateSchedule(
              { ...params, updateType: args.updateType, values: args.values },
              profileId,
            ),
        }),
    };
  }
}

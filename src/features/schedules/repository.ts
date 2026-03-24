import { FeatureRepository } from "@models/repository";
import { ScheduleOverrides, Schedules } from "@shared/lib/db";
import { format } from "date-fns";
import { Insertable, Selectable, sql } from "kysely";

export class ScheduleRepository extends FeatureRepository<"schedules"> {
  protected readonly table = "schedules";

  public findAll(params: {
    profileId: Selectable<Schedules>["profile_id"];
    date: Selectable<ScheduleOverrides>["original_date"];
    search?: Selectable<Schedules>["name"];
  }) {
    return this.db
      .selectFrom("schedules")
      .leftJoin("sounds", "schedules.sound_id", "sounds.id")
      .leftJoin("schedule_overrides", (join) =>
        join
          .onRef("schedules.id", "=", "schedule_overrides.schedule_id")
          .on("schedule_overrides.original_date", "=", params.date),
      )
      .leftJoin(
        "sounds as override_sounds",
        "schedule_overrides.new_sound_id",
        "override_sounds.id",
      )
      .select([
        "schedules.id",
        sql<string>`COALESCE(schedule_overrides.new_name, schedules.name)`.as(
          "name",
        ),
        "schedules.repeat",
        sql<number>`COALESCE(schedule_overrides.new_time, schedules.time)`.as(
          "final_time",
        ),
        sql<number | null>`COALESCE(override_sounds.id, sounds.id)`.as(
          "final_sound_id",
        ),
        sql<string>`COALESCE(override_sounds.name, sounds.name)`.as(
          "sound_name",
        ),
        sql<string>`COALESCE(override_sounds.file_name, sounds.file_name)`.as(
          "sound_file",
        ),
        "schedule_overrides.new_date",
        "schedule_overrides.is_cancelled",
      ])
      .where("schedules.profile_id", "=", params.profileId)
      .where("schedules.is_active", "=", 1)
      .where("schedules.start_date", "<=", params.date)
      .where(sql`COALESCE(schedule_overrides.is_cancelled, 0)`, "=", 0)
      .where(
        sql`COALESCE(schedule_overrides.new_date, ${params.date})`,
        "=",
        params.date,
      )
      .where((eb) =>
        eb.or([
          eb.and([
            eb("schedules.repeat", "=", "once"),
            eb("schedules.start_date", "=", params.date),
          ]),
          eb.and([
            eb("schedules.repeat", "=", "weekly"),
            eb.exists(
              eb
                .selectFrom("schedule_days")
                .select("schedule_days.schedule_id")
                .whereRef("schedule_days.schedule_id", "=", "schedules.id")
                .where(
                  "schedule_days.day_of_week",
                  "=",
                  sql<number>`CAST(strftime('%u', ${params.date}) AS INTEGER)`,
                ),
            ),
          ]),
        ]),
      )
      .$if(!!params.search, (qb) =>
        qb.where("schedules.name", "like", `%${params.search}%`),
      )
      .orderBy("final_time", "asc");
  }

  public findUpcomingOneTime(params: {
    profileId: Selectable<Schedules>["profile_id"];
    search?: Selectable<Schedules>["name"];
  }) {
    const today = format(new Date(), "yyyy-MM-dd");
    return this.db
      .selectFrom("schedules")
      .leftJoin("sounds", "schedules.sound_id", "sounds.id")
      .select([
        "schedules.id",
        "schedules.name",
        "schedules.time",
        "schedules.start_date",
        "sounds.id as sound_id",
        "sounds.name as sound_name",
        "sounds.file_name as sound_file",
        "schedules.repeat",
      ])
      .where("schedules.profile_id", "=", params.profileId)
      .where("schedules.is_active", "=", 1)
      .where("schedules.repeat", "=", "once")
      .where("schedules.start_date", ">=", today)
      .$if(!!params.search, (qb) =>
        qb.where("schedules.name", "like", `%${params.search}%`),
      )
      .orderBy("schedules.start_date", "asc")
      .orderBy("schedules.time", "asc");
  }

  public insert(value: Insertable<Schedules> & { days?: number[] }) {
    return this.db.transaction().execute(async (trx) => {
      const { days, ...rest } = value;
      const result = await trx
        .insertInto(this.table)
        .values(rest)
        .returning("id")
        .executeTakeFirstOrThrow();

      if (rest.repeat === "weekly" && days && days.length > 0) {
        await trx
          .insertInto("schedule_days")
          .values(
            days.map((day) => ({
              schedule_id: result.id,
              day_of_week: day,
            })),
          )
          .execute();
      }

      return result;
    });
  }

  public update(params: {
    id: Selectable<Schedules>["id"];
    profileId: Selectable<Schedules>["profile_id"];
    updateType: "only" | "all";
    date: Selectable<ScheduleOverrides>["original_date"];
    values: {
      name: string;
      time: number;
      sound_id: number | null;
      is_cancelled: boolean;
    };
  }) {
    if (params.updateType === "only") {
      return this.db
        .insertInto("schedule_overrides")
        .values({
          schedule_id: params.id,
          original_date: params.date,
          new_name: params.values.name,
          new_time: params.values.time,
          new_sound_id: params.values.sound_id,
          is_cancelled: params.values.is_cancelled ? 1 : 0,
        })
        .onConflict((oc) =>
          oc.columns(["schedule_id", "original_date"]).doUpdateSet({
            new_name: params.values.name,
            new_time: params.values.time,
            new_sound_id: params.values.sound_id,
            is_cancelled: params.values.is_cancelled ? 1 : 0,
          }),
        )
        .returning("schedule_id")
        .executeTakeFirstOrThrow();
    }

    return this.db
      .updateTable(this.table)
      .set({
        name: params.values.name,
        time: params.values.time,
        sound_id: params.values.sound_id,
        is_active: params.values.is_cancelled ? 0 : 1,
      })
      .where((eb) =>
        eb.and([
          eb("id", "=", params.id),
          eb("profile_id", "=", params.profileId),
        ]),
      )
      .returning("id")
      .executeTakeFirstOrThrow();
  }

  public findDays(scheduleId: Selectable<Schedules>["id"]) {
    return this.db
      .selectFrom("schedule_days")
      .select("day_of_week")
      .where("schedule_id", "=", scheduleId);
  }

  public delete(params: {
    id: Selectable<Schedules>["id"];
    profileId: Selectable<Schedules>["profile_id"];
    deleteType: "only" | "all";
    date: Selectable<ScheduleOverrides>["original_date"];
  }) {
    if (params.deleteType === "only") {
      return this.db
        .insertInto("schedule_overrides")
        .values({
          schedule_id: params.id,
          original_date: params.date,
          is_cancelled: 1,
        })
        .returning("schedule_id")
        .executeTakeFirstOrThrow();
    }

    return this.db
      .deleteFrom(this.table)
      .where((eb) =>
        eb.and([
          eb("id", "=", params.id),
          eb("profile_id", "=", params.profileId),
        ]),
      )
      .returning("id")
      .executeTakeFirstOrThrow();
  }
}

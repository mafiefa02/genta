import { FeatureRepository } from "@models/repository";
import { Profiles } from "@shared/lib/db";
import { Insertable, Updateable } from "kysely";

export class ProfileRepository extends FeatureRepository<"profiles"> {
  protected readonly table = "profiles";

  public findAll(params?: { search?: string }) {
    return this.db
      .selectFrom(this.table)
      .leftJoin("schedules", "profiles.id", "schedules.profile_id")
      .select(({ fn }) => [
        "profiles.id",
        "profiles.name",
        "profiles.timezone",
        "profiles.business_days",
        fn.count<number>("schedules.id").as("schedule_count"),
      ])
      .$if(!!params?.search, (qb) =>
        qb.where("profiles.name", "like", `%${params?.search}%`),
      )
      .groupBy("profiles.id");
  }

  public insert(profile: Insertable<Profiles>) {
    return this.db.insertInto(this.table).values(profile).returning("id");
  }

  public update(id: number, profile: Updateable<Profiles>) {
    return this.db
      .updateTable(this.table)
      .set(profile)
      .where("id", "=", id)
      .returning("id")
      .executeTakeFirstOrThrow();
  }

  public getBusinessDays(profileId: number) {
    return this.db
      .selectFrom(this.table)
      .select("business_days")
      .where("id", "=", profileId);
  }

  public updateBusinessDays(profileId: number, businessDays: number[]) {
    return this.db
      .updateTable(this.table)
      .set({ business_days: JSON.stringify(businessDays) })
      .where("id", "=", profileId)
      .returning("id")
      .executeTakeFirstOrThrow();
  }

  public delete(id: number) {
    return this.db
      .deleteFrom(this.table)
      .where("id", "=", id)
      .returning("id")
      .executeTakeFirstOrThrow();
  }
}

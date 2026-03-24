import { FeatureServices } from "@models/service";
import { Profiles } from "@shared/lib/db";
import { handleThrowError } from "@shared/lib/utils";
import { mutationOptions, queryOptions } from "@tanstack/react-query";
import { Insertable, Updateable } from "kysely";
import { ProfileRepository } from "./repository";

export class ProfileServices extends FeatureServices<ProfileRepository> {
  private getProfiles = async (params: { search?: string } = {}) => {
    try {
      return await this.repository.findAll(params).execute();
    } catch (e) {
      return handleThrowError(e);
    }
  };

  private createProfile = async ({ name, timezone }: Insertable<Profiles>) => {
    try {
      const result = await this.repository
        .insert({ name, timezone })
        .executeTakeFirstOrThrow();

      await this.config.set("active_profile", result.id);

      return result;
    } catch (e) {
      return handleThrowError(e);
    }
  };

  private updateProfile = async (
    params: { id: number } & Updateable<Profiles>,
  ) => {
    try {
      const { id, ...values } = params;
      return await this.repository.update(id, values);
    } catch (e) {
      return handleThrowError(e);
    }
  };

  private getBusinessDays = async (profileId: number) => {
    try {
      const result = await this.repository
        .getBusinessDays(profileId)
        .executeTakeFirstOrThrow();
      return JSON.parse(result.business_days) as number[];
    } catch (e) {
      return handleThrowError(e);
    }
  };

  private setBusinessDays = async (params: {
    profileId: number;
    businessDays: number[];
  }) => {
    try {
      return await this.repository.updateBusinessDays(
        params.profileId,
        params.businessDays,
      );
    } catch (e) {
      return handleThrowError(e);
    }
  };

  private deleteProfile = async (id: number) => {
    try {
      return await this.repository.delete(id);
    } catch (e) {
      return handleThrowError(e);
    }
  };

  get query() {
    return {
      getProfiles: (params: { search?: string } = {}) =>
        queryOptions({
          queryKey: ["profiles", params],
          queryFn: () => this.getProfiles(params),
        }),
      getBusinessDays: (profileId: number) =>
        queryOptions({
          queryKey: ["business-days", profileId],
          queryFn: () => this.getBusinessDays(profileId),
        }),
    };
  }

  get mutation() {
    return {
      insertProfile: mutationOptions({
        mutationKey: ["create-profile"],
        mutationFn: this.createProfile,
      }),
      updateProfile: mutationOptions({
        mutationKey: ["update-profile"],
        mutationFn: this.updateProfile,
      }),
      deleteProfile: mutationOptions({
        mutationKey: ["delete-profile"],
        mutationFn: this.deleteProfile,
      }),
      updateBusinessDays: mutationOptions({
        mutationKey: ["update-business-days"],
        mutationFn: this.setBusinessDays,
      }),
    };
  }
}

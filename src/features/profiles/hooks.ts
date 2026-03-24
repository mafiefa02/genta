import { FormPrimitive } from "@shared/components/ui/form";
import { useValidateForm } from "@shared/lib/hooks";
import { services } from "@shared/lib/services";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useCallback } from "react";
import { useNavigate } from "react-router";
import { createProfileSchema } from "./schemas";

const DEFAULT_BUSINESS_DAYS = [1, 2, 3, 4, 5];

export const useBusinessDays = () => {
  const { data: activeProfileId } = useQuery(
    services.config.get("active_profile"),
  );

  const { data: businessDays } = useQuery({
    ...services.profile.query.getBusinessDays(activeProfileId ?? 0),
    enabled: !!activeProfileId,
  });

  return businessDays ?? DEFAULT_BUSINESS_DAYS;
};

export const useCreateProfileForm = () => {
  const { errors, validateForm } = useValidateForm(createProfileSchema);
  const navigate = useNavigate();
  const mutation = useMutation({
    ...services.profile.mutation.insertProfile,
    onSuccess: () => navigate("/"),
  });

  const handleSubmit = useCallback(
    (values: FormPrimitive.Values) => {
      const validated = validateForm(values);
      if (validated.success) {
        return mutation.mutate({
          name: validated.data["profile-name"],
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        });
      }
    },
    [validateForm, mutation],
  );

  return {
    errors,
    handleSubmit,
    mutation,
  };
};

import { Form } from "@base-ui-components/react/form";
import { useCallback, useEffect, useState } from "react";
import { z } from "zod";

type Errors = Record<string, string | string[]>;

export const useValidateForm = <T>(schema: z.Schema<T>) => {
  const [errors, setErrors] = useState<Errors | undefined>(undefined);

  const validateForm = useCallback(
    (formValues: Form.Values) => {
      const validate = schema.safeParse(formValues);

      if (!validate.success) {
        const errors = z.flattenError(validate.error).fieldErrors as Errors;
        setErrors(errors);
        return validate;
      }

      setErrors(undefined);
      return validate;
    },
    [schema],
  );

  return { errors, validateForm };
};

/**
 * A custom hook that returns the current time,
 * updating every seconds.
 */
export const useTime = () => {
  const [time, setTime] = useState(new Date());
  useEffect(() => {
    let intervalId: ReturnType<typeof setInterval>;
    const delay = 1000 - new Date().getMilliseconds();
    const timeoutId = setTimeout(() => {
      setTime(new Date());
      intervalId = setInterval(() => {
        setTime(new Date());
      }, 1000);
    }, delay);
    return () => {
      clearTimeout(timeoutId);
      clearInterval(intervalId);
    };
  }, []);
  return time;
};

/** Debounce `value` by a `delay` amount */
export const useDebounce = <T>(value: T, delay: number) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

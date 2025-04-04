import { useState, ChangeEvent, FormEvent, useCallback } from 'react';

interface UseFormProps<T extends Record<string, unknown>> {
  initialValues: T;
  onSubmit: (values: T) => void | Promise<void>;
  validate?: (values: T) => Partial<Record<keyof T, string>>;
}

export function useForm<T extends Record<string, unknown>>({
  initialValues,
  onSubmit,
  validate,
}: UseFormProps<T>) {
  const [values, setValues] = useState<T>(initialValues);
  const [touched, setTouched] = useState<Partial<Record<keyof T, boolean>>>({});
  const [errors, setErrors] = useState<Partial<Record<keyof T, string>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Handle input changes
  const handleChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const { name, value, type, checked } = e.target;
      const fieldValue = type === 'checkbox' ? checked : value;

      // Update values
      setValues((prev) => ({
        ...prev,
        [name]: fieldValue,
      }));

      // Validate the field if already touched
      if (touched[name as keyof T] && validate) {
        const fieldErrors = validate({ ...values, [name]: fieldValue });
        setErrors((prev) => ({
          ...prev,
          [name]: fieldErrors[name as keyof T],
        }));
      }
    },
    [values, touched, validate]
  );

  // Handle input blur
  const handleBlur = useCallback(
    (e: { target: { name: string } }) => {
      const { name } = e.target;

      // Mark field as touched
      setTouched((prev) => ({
        ...prev,
        [name]: true,
      }));

      // Validate the field
      if (validate) {
        const fieldErrors = validate(values);
        setErrors((prev) => ({
          ...prev,
          [name]: fieldErrors[name as keyof T],
        }));
      }
    },
    [values, validate]
  );

  // Handle form submission
  const handleSubmit = useCallback(
    async (e: FormEvent<HTMLFormElement>) => {
      e.preventDefault();

      // Mark all fields as touched
      const allTouched = Object.keys(values).reduce(
        (acc, key) => ({ ...acc, [key]: true }),
        {} as Partial<Record<keyof T, boolean>>
      );
      setTouched(allTouched);

      // Validate all fields
      if (validate) {
        const validationErrors = validate(values);
        if (Object.keys(validationErrors).length > 0) {
          setErrors(validationErrors);
          return;
        }
      }

      // Submit the form
      setIsSubmitting(true);
      try {
        await onSubmit(values);
      } catch (error) {
        console.error('Form submission error:', error);
      } finally {
        setIsSubmitting(false);
      }
    },
    [values, onSubmit, validate]
  );

  // Reset the form to its initial state
  const reset = useCallback(() => {
    setValues(initialValues);
    setErrors({});
    setTouched({});
    setIsSubmitting(false);
  }, [initialValues]);

  return {
    values,
    errors,
    touched,
    isSubmitting,
    handleChange,
    handleBlur,
    handleSubmit,
    setValues,
    setErrors,
    setTouched,
    reset,
  };
}

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

  const handleChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setValues((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
    
    // If field has been touched and we have a validation function, validate this field
    if (touched[name as keyof T] && validate) {
      const fieldErrors = validate({
        ...values,
        [name]: type === 'checkbox' ? checked : value,
      });
      setErrors(prev => ({
        ...prev,
        [name]: fieldErrors[name as keyof T]
      }));
    }
  }, [values, touched, validate]);

  const handleBlur = useCallback((e: { target: { name: string } }) => {
    const { name } = e.target;
    setTouched(prev => ({
      ...prev,
      [name]: true
    }));
    
    // Validate field on blur
    if (validate) {
      const fieldErrors = validate(values);
      setErrors(prev => ({
        ...prev,
        [name]: fieldErrors[name as keyof T]
      }));
    }
  }, [values, validate]);

  const handleSubmit = useCallback(async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    // Mark all fields as touched
    const allTouched = Object.keys(values).reduce((acc, key) => {
      acc[key as keyof T] = true;
      return acc;
    }, {} as Partial<Record<keyof T, boolean>>);
    setTouched(allTouched);
    
    // Validate all fields
    if (validate) {
      const validationErrors = validate(values);
      if (Object.keys(validationErrors).length > 0) {
        setErrors(validationErrors);
        return;
      }
    }

    setIsSubmitting(true);
    try {
      await onSubmit(values);
    } catch (error) {
      console.error('Form submission error:', error);
    } finally {
      setIsSubmitting(false);
    }
  }, [values, onSubmit, validate]);

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
    reset,
  };
}
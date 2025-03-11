import React from "react";
import { FieldPath, FieldValues, UseFormReturn } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

/**
 * Get form field error message
 */
export function getFormFieldError<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
>(form: UseFormReturn<TFieldValues>, name: TName): string | undefined {
  const error = form.formState.errors[name];
  return error?.message as string | undefined;
}

/**
 * Check if form field has error
 */
export function hasFormFieldError<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
>(form: UseFormReturn<TFieldValues>, name: TName): boolean {
  return !!form.formState.errors[name];
}

/**
 * Create a form with zod schema validation
 */
export function createZodForm<TSchema extends z.ZodType>(
  schema: TSchema,
  defaultValues?: z.infer<TSchema>,
) {
  return useForm<z.infer<TSchema>>({
    resolver: zodResolver(schema),
    defaultValues,
  });
}

/**
 * Form field wrapper component
 */
export function FormField<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
>({
  form,
  name,
  label,
  description,
  children,
  className,
}: {
  form: UseFormReturn<TFieldValues>;
  name: TName;
  label?: React.ReactNode;
  description?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  const error = getFormFieldError(form, name);
  const hasError = hasFormFieldError(form, name);

  return (
    <div className={className}>
      {label && (
        <label
          htmlFor={name}
          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 mb-2 block"
        >
          {label}
        </label>
      )}
      {children}
      {description && !hasError && (
        <p className="text-sm text-muted-foreground mt-1">{description}</p>
      )}
      {hasError && <p className="text-sm text-destructive mt-1">{error}</p>}
    </div>
  );
}

/**
 * Form section component
 */
export function FormSection({
  title,
  description,
  children,
  className,
}: {
  title?: React.ReactNode;
  description?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`space-y-4 ${className || ""}`}>
      {(title || description) && (
        <div className="space-y-1">
          {title && <h3 className="text-lg font-medium">{title}</h3>}
          {description && (
            <p className="text-sm text-muted-foreground">{description}</p>
          )}
        </div>
      )}
      <div className="space-y-4">{children}</div>
    </div>
  );
}

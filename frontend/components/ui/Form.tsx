import { InputHTMLAttributes, TextareaHTMLAttributes, SelectHTMLAttributes, forwardRef } from "react";
import clsx from "clsx";

const fieldClasses =
  "w-full rounded border border-paper-line bg-paper-raised px-3 py-2 text-sm text-ink placeholder:text-steel-light focus:border-amber focus:outline-none focus:ring-1 focus:ring-amber";

interface FieldWrapperProps {
  label?: string;
  error?: string;
  hint?: string;
  id: string;
  children: React.ReactNode;
}

export function FieldWrapper({ label, error, hint, id, children }: FieldWrapperProps) {
  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label htmlFor={id} className="text-sm font-semibold text-ink-soft">
          {label}
        </label>
      )}
      {children}
      {hint && !error && <p className="text-xs text-steel">{hint}</p>}
      {error && <p className="text-xs font-medium text-danger">{error}</p>}
    </div>
  );
}

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, id, className, ...props }, ref) => (
    <FieldWrapper label={label} error={error} hint={hint} id={id!}>
      <input ref={ref} id={id} className={clsx(fieldClasses, className)} {...props} />
    </FieldWrapper>
  )
);
Input.displayName = "Input";

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, hint, id, className, ...props }, ref) => (
    <FieldWrapper label={label} error={error} hint={hint} id={id!}>
      <textarea ref={ref} id={id} className={clsx(fieldClasses, "min-h-[100px] resize-y", className)} {...props} />
    </FieldWrapper>
  )
);
Textarea.displayName = "Textarea";

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, hint, id, className, children, ...props }, ref) => (
    <FieldWrapper label={label} error={error} hint={hint} id={id!}>
      <select ref={ref} id={id} className={clsx(fieldClasses, className)} {...props}>
        {children}
      </select>
    </FieldWrapper>
  )
);
Select.displayName = "Select";

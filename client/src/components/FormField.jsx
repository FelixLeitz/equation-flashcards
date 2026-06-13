import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils.js';

/**
 * Label + Input + inline error message.
 * Pass register(...) spread props plus the field's error (if any).
 */
export function FormField({
  id,
  label,
  type = 'text',
  error,
  registration,
  ...inputProps
}) {
  const errorId = error ? `${id}-error` : undefined;
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        type={type}
        aria-invalid={Boolean(error)}
        aria-describedby={errorId}
        className={cn(error && 'border-destructive')}
        {...registration}
        {...inputProps}
      />
      {error && (
        <p id={errorId} className="text-sm text-destructive">
          {error.message}
        </p>
      )}
    </div>
  );
}

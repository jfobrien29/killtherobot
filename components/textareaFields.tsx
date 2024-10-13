import { Label } from '@radix-ui/react-label';
import React from 'react';
import { useFormContext } from 'react-hook-form';
import { cn } from '@/lib/utils';
import { Textarea } from './ui/textarea';

type Props = {
  label: string;
  name: string;
  placeholder?: string;
  sublabel?: string;
  className?: string;
  disabled?: boolean;
};

export const TextareaField = ({
  label,
  placeholder,
  sublabel,
  className,
  name,
  disabled,
}: Props) => {
  const formCtx = useFormContext();

  const errorMessage = formCtx?.formState?.errors[name] ? (
    // @ts-expect-error bad typings
    <div className="text-xs text-red-600 mt-1">{formCtx.formState.errors[name].message}</div>
  ) : null;

  return (
    <div className={cn('w-full', className)}>
      <Label className="text-sm pb-4 font-semibold">{label}</Label>
      {sublabel && <p className="text-xs text-zinc-400">{sublabel}</p>}
      <Textarea
        className="mt-1"
        placeholder={placeholder}
        {...formCtx?.register(name)}
        disabled={disabled}
      />
      {errorMessage}
    </div>
  );
};

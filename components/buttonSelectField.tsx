import { Label } from '@radix-ui/react-label';
import React from 'react';
import { useFormContext } from 'react-hook-form';
import { Input } from './ui/input';
import { cn } from '@/lib/utils';

type Props = {
  label: string;
  name: string;
  placeholder?: string;
  sublabel?: string;
  className?: string;
  type?: React.HTMLInputTypeAttribute;
  disabled?: boolean;
};

export const InputField = ({
  label,
  placeholder,
  sublabel,
  className,
  type,
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
      <Label className="text-sm">{label}</Label>
      {sublabel && <p className="text-xs text-zinc-400">{sublabel}</p>}
      <Input
        placeholder={placeholder}
        type={type}
        {...formCtx?.register(name)}
        disabled={disabled}
      />
      {errorMessage}
    </div>
  );
};

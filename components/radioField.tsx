import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Controller, useFormContext } from 'react-hook-form';
import { cn } from '@/lib/utils';

type Option = {
  value: string;
  label: string;
};

type Props = {
  label: string;
  name: string;
  sublabel?: string;
  className?: string;
  options: Option[];
};

export const RadioField = ({ label, sublabel, className, name, options }: Props) => {
  const formCtx = useFormContext();

  const errorMessage = formCtx?.formState?.errors[name] ? (
    // @ts-expect-error bad typings
    <div className="text-xs text-red-600 mt-1">{formCtx.formState.errors[name].message}</div>
  ) : null;

  return (
    <div className={cn('w-full', className)}>
      <Label className="text-sm font-normal">{label}</Label>
      {sublabel && <p className="text-xs text-zinc-400">{sublabel}</p>}
      <Controller
        name={name}
        control={formCtx.control}
        render={({ field }) => (
          <RadioGroup className="flex flex-col sm:flex-row gap-4 mt-1">
            {options.map(({ value, label }) => (
              <div
                key={value}
                className="flex-1 cursor-pointer"
                onClick={() => field.onChange(value)}
              >
                <RadioGroupItem
                  checked={field.value === value}
                  value={value}
                  id={value}
                  className="peer sr-only checked:bg-gray-400 checked:outline-black"
                />
                <Label
                  htmlFor={value}
                  className="flex flex-col items-center justify-center p-4 border-2 rounded-lg cursor-pointer hover:bg-secondary transition-colors peer-checked:border-primary peer-checked:bg-primary/10"
                >
                  <span className="text-sm font-medium">{label}</span>
                </Label>
              </div>
            ))}
          </RadioGroup>
        )}
      />
      {errorMessage}
    </div>
  );
};

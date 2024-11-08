/* eslint-disable @typescript-eslint/no-explicit-any */
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Controller, useFormContext } from 'react-hook-form';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

type Option = {
  value: any;
  label: string;
  tooltip?: string;
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
    <div className="text-xs text-red-600 mt-1">{formCtx.formState.errors[name].message}</div>
  ) : null;

  return (
    <div className={cn('w-full', className)}>
      <Label className="text-sm font-normal">{label}</Label>
      {sublabel && <p className="text-xs text-zinc-400">{sublabel}</p>}
      <Controller
        name={name}
        control={formCtx.control}
        render={({ field }: any) => (
          <RadioGroup
            className="flex flex-col sm:flex-row gap-4 mt-1"
            value={field.value}
            onValueChange={field.onChange}
          >
            {options.map(({ value, label }) => (
              <TooltipProvider key={value}>
                <Tooltip>
                  <TooltipTrigger className="w-full">
                    <div className="flex-1 w-full">
                      <RadioGroupItem value={value} id={value} className="peer sr-only" />
                      <Label
                        htmlFor={value}
                        className={cn(
                          'flex flex-col items-center justify-center p-4 border-2 rounded-lg cursor-pointer hover:bg-secondary transition-colors',
                          field.value === value
                            ? 'bg-gray-900/50 border-black text-white hover:bg-gray-500'
                            : '',
                        )}
                      >
                        <span className="text-sm font-medium">{label}</span>
                      </Label>
                    </div>
                  </TooltipTrigger>
                  {field.tooltip && (
                    <TooltipContent>
                      <p>{field.tooltip}</p>
                    </TooltipContent>
                  )}
                </Tooltip>
              </TooltipProvider>
            ))}
          </RadioGroup>
        )}
      />
      {errorMessage}
    </div>
  );
};

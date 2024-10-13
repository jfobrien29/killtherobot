/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';
import { Button } from '@/components/ui/button';
import { FormProvider, useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as Yup from 'yup';
import { useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { useRouter } from 'next/navigation';
import { TextareaField } from '@/components/textareaFields';

const schema = Yup.object().shape({
  name: Yup.string().required('Name is required'),
});

export default function Home() {
  const methods = useForm({
    resolver: yupResolver(schema),
  });
  const router = useRouter();
  const createGame = useMutation(api.game.create);

  const onSubmit = async (data: { name: string }) => {
    console.log(data);
    const code = await createGame({
      name: data.name,
    });

    router.push(`/g/${code}`);
  };

  return (
    <div className="flex flex-col items-center min-h-screen pb-20 gap-8 p-4 relative">
      <div className="absolute inset-0 bg-[url('/bg.webp')] bg-cover bg-center opacity-5 z-0"></div>
      <div className="z-10 flex flex-col items-center gap-8 relative">
        <h1 className="mt-8 text-xl font-bold text-gray-600">Booting up Kill The Robot...</h1>
        <div className="max-w-md text-sm">
          <p className="mt-2">First time? Here are some tips to get you started:</p>
          <ul className="list-disc space-y-2 pl-4 mt-2">
            <li>Pick a great theme your group will love</li>
            <li>Join the game on your phone</li>
            <li>Enter in a a response to your prompt</li>
            <li>Vote off the players you think are robots</li>
            <li>Will humanity survive!?</li>
          </ul>
        </div>
        <FormProvider {...methods}>
          <form onSubmit={methods.handleSubmit(onSubmit)} className="w-full max-w-md">
            <TextareaField
              label="Give the theme of your game:"
              placeholder={`ex. Space travel, Star Wars, 1776 America`}
              name="name"
            />
            <Button type="submit" className="mt-4 w-full">
              Start Kill The Robot
            </Button>
          </form>
        </FormProvider>
      </div>
    </div>
  );
}

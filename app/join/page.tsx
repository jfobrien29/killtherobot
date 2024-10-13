/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';
import { Button } from '@/components/ui/button';
import { FormProvider, useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as Yup from 'yup';
import { InputField } from '@/components/inputField';
import { useMutation, useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { useParams, useRouter } from 'next/navigation';

const schema = Yup.object().shape({
  code: Yup.string().required('Game code is required'),
  name: Yup.string()
    .required('Name is required')
    .min(2, 'Name must be at least 2 characters')
    .max(20, 'Name must be at most 20 characters')
    .matches(/^[A-Za-z\s]+$/, 'Only characters and spaces are allowed'),
});

export default function Home() {
  const methods = useForm({
    resolver: yupResolver(schema),
  });
  const router = useRouter();
  const { code } = useParams();
  const game = useQuery(api.game.get, { code: code as string });
  const joinGame = useMutation(api.game.join);

  const onSubmit = async (data: { name: string; code: string }) => {
    console.log(data);
    try {
      await joinGame({
        name: data.name,
        code: data.code,
      });
      router.push(`/g/${data.code}/${encodeURI(data.name)}`);
    } catch (e: any) {
      console.error(e);
      console.log('error', e.message);
    }
  };

  return (
    <div className="flex flex-col items-center min-h-screen pb-20 gap-16 p-4 w-full justify-between">
      <div className="absolute inset-0 bg-[url('/bg.webp')] bg-cover bg-center opacity-5 z-0"></div>

      <div className="w-full">
        <div className="text-center text-sm text-gray-500 mb-4">
          <h2 className="text-base font-semibold">{game?.name || 'Kill The Robot'}</h2>
        </div>
        <h1>Booting up Kill The Robot...</h1>
        <FormProvider {...methods}>
          <form onSubmit={methods.handleSubmit(onSubmit)} className="w-full max-w-md space-y-4">
            <InputField label="Game Code" name="code" />
            <InputField label="Your First Name" name="name" />
            <Button type="submit" className="mt-4 w-full">
              Join Game
            </Button>
          </form>
        </FormProvider>
      </div>
    </div>
  );
}

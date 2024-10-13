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
  name: Yup.string()
    .required('Name is required')
    .min(2, 'Name must be at least 2 characters')
    .max(20, 'Name must be at most 20 characters')
    .matches(/^[A-Za-z\s]+$/, 'Only characters and spaces are allowed'),
});

export default function Home() {
  const { code } = useParams();
  const methods = useForm({
    resolver: yupResolver(schema),
  });
  const game = useQuery(api.game.get, { code: code as string });
  const router = useRouter();

  const joinGame = useMutation(api.game.join);

  const onSubmit = async (data: { name: string }) => {
    console.log(data);
    try {
      await joinGame({
        name: data.name,
        code: code as string,
      });
      router.push(`/g/${code}/${encodeURI(data.name)}`);
    } catch (e: any) {
      console.error(e);
      console.log('error', e.message);
    }
  };

  return (
    <div className="flex flex-col items-center min-h-screen pb-20 gap-16 p-4 w-full justify-between">
      <div className="absolute inset-0 bg-[url('/bg.webp')] bg-cover bg-center opacity-5 z-0"></div>
      <div className="w-full relative z-10 flex flex-col items-center min-h-screen gap-16">
        <div className="text-center text-sm text-gray-500 mb-4">
          <h2 className="text-base font-semibold">{game?.name || 'Kill The Robot'}</h2>
        </div>
        <FormProvider {...methods}>
          <form onSubmit={methods.handleSubmit(onSubmit)} className="w-full max-w-md space-y-4">
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

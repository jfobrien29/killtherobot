/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';
import { Button } from '@/components/ui/button';
import { FormProvider, useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as Yup from 'yup';
import { useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { useRouter } from 'next/navigation';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

import { TextareaField } from '@/components/textareaFields';
import { RadioField } from '@/components/radioField';
import { GameType, HasCyborg } from '@/convex/schema';

const schema = Yup.object().shape({
  name: Yup.string().required('We need a great theme to get started!'),
  gameType: Yup.string().required('We need a game mode to get started!'),
  includeCyborg: Yup.string().required('We need to know if you want to include the cyborg!'),
});

export default function Home() {
  const methods = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      gameType: GameType.ELIMINATION,
      includeCyborg: HasCyborg.NO,
    },
  });
  const router = useRouter();
  const createGame = useMutation(api.game.create);

  const onSubmit = async (data: { name: string; gameType: string; includeCyborg: string }) => {
    console.log(data);
    const code = await createGame({
      name: data.name,
      gameType: data.gameType,
      hasCyborg: data.includeCyborg === HasCyborg.YES,
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
            <li>First pick a great theme for the game your group will love</li>
            <li>
              Your objective is to determine who the robots are each round and eliminate them.
            </li>
            <li>
              But be carefule, one player is <span className="font-semibold">the cyborg</span> and
              works for the robots! They&apos;ll feed the robots information and try to stop you
              from voting them off.
            </li>
            <li>
              Each round you&apos;ll all answer a prompt on your phones then vote off the{' '}
              <span className="font-semibold">least human sounding responses</span>.
            </li>
            <li>Will humanity survive!?</li>
          </ul>
        </div>
        <FormProvider {...methods}>
          <form className="w-full max-w-md">
            <TextareaField
              label="Give the theme of your game:"
              placeholder={`ex. AGI apocalypse, Star Wars, 1776 America`}
              name="name"
            />

            <Button onClick={methods.handleSubmit(onSubmit)} className="mt-4 w-full">
              Start Kill The Robot
            </Button>
          </form>
          <div className="w-full max-w-md">
            <Accordion type="single" collapsible>
              <AccordionItem value="item-1">
                <AccordionTrigger>Advanced Setup</AccordionTrigger>
                <AccordionContent>
                  <RadioField
                    className="mt-4"
                    label=""
                    name="gameType"
                    options={[
                      {
                        label: 'Elimination',
                        tooltip:
                          'Each round you vote off the least human sounding response until the humans or the robots win.',
                        value: GameType.ELIMINATION,
                      },
                      {
                        label: 'Lives',
                        tooltip: 'Humans and robots each have 3 lives. Last team standing wins!',
                        value: GameType.LIVES,
                      },
                    ]}
                  />
                  <RadioField
                    label=""
                    name="includeCyborg"
                    options={[
                      {
                        label: 'Play with a cyborg',
                        tooltip:
                          'One human will play as the cyborg and feed information to the robots about other humans to improve their chances of surviving.',
                        value: HasCyborg.YES,
                      },
                      {
                        label: 'Just humans',
                        tooltip: 'All players are playing against the robots.',
                        value: HasCyborg.NO,
                      },
                    ]}
                  />
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
        </FormProvider>
      </div>
    </div>
  );
}

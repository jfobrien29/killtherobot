/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';
import { useMutation, useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { GAME_STAGE } from '@/convex/game';
import * as Yup from 'yup';
import { FormProvider, useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { TextareaField } from '@/components/textareaFields';
import { useState } from 'react';
import { useToast } from '@/components/ui/use-toast';

const WaitToStart = () => {
  const { code, player } = useParams();
  const game = useQuery(api.game.get, { code: code as string });
  const start = useMutation(api.game.start);

  const isAdmin = game?.humans.find((human) => human.name === decodeURI(player as string))?.isAdmin;

  return (
    <div className="flex flex-col gap-4 items-center">
      <h2>Waiting for game to start</h2>
      {isAdmin && (
        <Button
          onClick={() => start({ code: code as string, name: game!.humans[0].name })}
          disabled={(game?.humans.length || 0) <= 1}
        >
          Start Game (Only visible to you)
        </Button>
      )}
    </div>
  );
};

const answeringSchema = Yup.object().shape({
  answer: Yup.string()
    .required('Answer is required')
    .min(2, 'Answer must be at least 2 characters')
    .max(100, 'Answer must be at most 100 characters'),
  cyborgContext: Yup.string().optional(),
});

const Answering = () => {
  const { code, player } = useParams();
  const submitHumanAnswer = useMutation(api.game.submitHumanAnswer);
  const playerName = decodeURI(player as string);

  const game = useQuery(api.game.get, { code: code as string });
  const methods = useForm({
    resolver: yupResolver(answeringSchema),
  });

  const onSubmit = async (data: { answer: string; cyborgContext?: string }) => {
    console.log(data);
    await submitHumanAnswer({
      code: code as string,
      name: playerName,
      answer: data.answer,
      cyborgContext: data.cyborgContext,
    });
    methods.reset();
  };

  if (!game) {
    return <div>Loading...</div>;
  }

  const currentRound = game.rounds[game.currentRound];
  if (!currentRound) {
    return <div>Whoops...</div>;
  }

  const currentPlayerAnswer = game.humans.find((human) => human.name === playerName);
  if (!!currentPlayerAnswer && !currentPlayerAnswer.isAlive) {
    return (
      <div className="w-full flex justify-center">
        <div>You were eliminated!</div>
      </div>
    );
  }

  if (!!currentRound.answers.find((answer) => answer.name === playerName)) {
    return (
      <div className="w-full flex justify-center">
        <div>Waiting for other players to answer...</div>
      </div>
    );
  }

  return (
    <div className="w-full flex justify-center">
      <div className="p-4 w-full flex flex-col gap-4 max-w-md">
        <FormProvider {...methods}>
          <form onSubmit={methods.handleSubmit(onSubmit)} className="flex flex-col gap-4 w-full">
            <TextareaField name="answer" label={currentRound.question} placeholder="..." />
            {currentPlayerAnswer?.isCyborg && (
              <TextareaField
                name="cyborgContext"
                label="YOU ARE THE CYBORG. If you want, give your robot allies more info about the humans here."
                placeholder="(optional) give your robot allies more info about the humans to help them blend in (ex. inside jokes, whos in the room, etc.)"
              />
            )}
            <Button type="submit">Submit Answer</Button>
          </form>
        </FormProvider>
      </div>
    </div>
  );
};

const Waiting = () => {
  return (
    <div className="w-full flex justify-center">
      <div>Waiting...</div>
    </div>
  );
};

const ShowRankings = () => {
  return (
    <div className="w-full flex justify-center">
      <div>Show Rankings</div>
    </div>
  );
};

const GameOver = () => {
  return (
    <div className="w-full flex justify-center">
      <div>Game Over</div>
    </div>
  );
};

const Voting = () => {
  const { code, player } = useParams();
  const submitHumanVote = useMutation(api.game.vote);
  const playerName = decodeURI(player as string);
  const [selectedVotes, setSelectedVotes] = useState<string[]>([]);
  const { toast } = useToast();

  const selectVote = (vote: string) => {
    setSelectedVotes((prev) =>
      prev.includes(vote) ? prev.filter((v) => v !== vote) : [...prev, vote],
    );
  };

  const game = useQuery(api.game.get, { code: code as string });

  const onSubmit = async () => {
    if (selectedVotes.length !== 2) {
      toast({
        title: 'Please vote for 2 answers to eliminate',
      });
      return;
    }
    await submitHumanVote({ code: code as string, name: playerName, votes: selectedVotes });
  };

  if (!game) {
    return <div>Loading...</div>;
  }

  const currentPlayerAnswer = game.humans.find((human) => human.name === playerName);
  if (!!currentPlayerAnswer && !currentPlayerAnswer.isAlive) {
    return (
      <div className="w-full flex justify-center">
        <div>You were eliminated!</div>
      </div>
    );
  }

  const currentRound = game.rounds[game.currentRound];
  if (!currentRound) {
    return <div>Whoops...</div>;
  }

  if (
    currentRound.answers
      .map((answer) => answer.votes)
      .flat()
      .includes(playerName)
  ) {
    return (
      <div className="w-full flex flex-col justify-center items-center">
        <div>Waiting for other players to vote...</div>
      </div>
    );
  }

  return (
    <div className="w-full flex justify-center">
      <div className="p-4 w-full flex flex-col gap-4 max-w-md">
        <div className="w-full">{currentRound.question}</div>
        {currentRound.answers.map((answer: any) => (
          <div key={answer.text} className="w-full">
            <Button
              variant={selectedVotes.includes(answer.text) ? 'secondary' : 'outline'}
              onClick={() => selectVote(answer.text)}
              className="w-full text-wrap h-fit"
            >
              {answer.text}
            </Button>
          </div>
        ))}
        <Button onClick={() => onSubmit()}>Vote to Eliminate 2 Responses</Button>
      </div>
    </div>
  );
};

const Reveal = () => {
  const { code, player } = useParams();
  const game = useQuery(api.game.get, { code: code as string });
  const nextMatchup = useMutation(api.game.nextRound);

  if (!game) {
    return <div>Loading...</div>;
  }

  const playerName = decodeURI(player as string);
  const human = game.humans.find((human) => human.name === playerName);

  if (!human) {
    return <div>Loading...</div>;
  }

  const isAdmin = human.isAdmin;

  return (
    <div>
      <div className="w-full flex justify-center">
        <div>Look who you eliminated!</div>
      </div>
      {!isAdmin && (
        <div className="w-full flex justify-center italic mt-2 text-sm">
          <div>(Waiting for the admin to move forward)</div>
        </div>
      )}
      {isAdmin && (
        <div className="flex w-full justify-center mt-4">
          <Button className="w-fit" onClick={() => nextMatchup({ code: code as string })}>
            Start Next Round (only visible to you)
          </Button>
        </div>
      )}
    </div>
  );
};

export default function PlayerPage() {
  const { code, player } = useParams();
  const game = useQuery(api.game.get, { code: code as string });
  const adminSkip = useMutation(api.game.adminSkip);

  if (!game) {
    return <div>Loading...</div>;
  }

  const playerName = decodeURI(player as string);

  const human = game.humans.find((human) => human.name === playerName);

  if (!human) {
    return <div>Loading...</div>;
  }

  return (
    <div className="flex flex-col items-center min-h-screen  gap-16 w-full justify-between relative">
      <div className="absolute inset-0 bg-[url('/bg.webp')] bg-cover bg-center opacity-5 z-0"></div>
      <div className="relative flex flex-col items-center min-h-screen p-4 gap-16 w-full justify-between">
        <div className="w-full">
          <div className="text-center text-sm text-gray-500 mb-4">
            <h1 className="text-base font-semibold">{game.name}</h1>
            <h2 className="text-xs">Playing as {human.name}</h2>
            {human.isAdmin && (
              <div className="text-xs italic font-semibold">(You are the game admin)</div>
            )}
            {game.stage !== GAME_STAGE.PLAYERS_JOINING &&
              game.stage !== GAME_STAGE.GAME_STARTING &&
              human.isCyborg && (
                <div className="text-xs italic font-semibold">(You are the CYBORG)</div>
              )}
            {game.stage !== GAME_STAGE.PLAYERS_JOINING &&
              game.stage !== GAME_STAGE.GAME_STARTING &&
              !human.isCyborg && (
                <div className="text-xs italic font-semibold">(You are NOT the CYBORG)</div>
              )}
          </div>

          <div className="flex flex-col gap-4 w-full mt-16">
            {(game.stage === GAME_STAGE.PLAYERS_JOINING ||
              game.stage === GAME_STAGE.GAME_STARTING) && <WaitToStart />}
            {game.stage === GAME_STAGE.ENTER_RESPONSES && <Answering />}
            {game.stage === GAME_STAGE.VOTING && <Voting />}
            {game.stage === GAME_STAGE.REVEAL && <Reveal />}
            {game.stage === GAME_STAGE.NEXT_ROUND_LOADING && <div>Loading next round...</div>}

            {game.stage === GAME_STAGE.PAUSED && <Waiting />}
            {game.stage === GAME_STAGE.SHOW_RANKINGS && <ShowRankings />}
            {game.stage === GAME_STAGE.GAME_OVER && <GameOver />}
          </div>
        </div>
        {human.isAdmin && (
          <div className="flex w-full justify-center">
            <Button className="w-fit" onClick={() => adminSkip({ code: code as string })}>
              Admin Skip (Use if stuck, only visible to you)
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

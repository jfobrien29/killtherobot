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
});

const Answering = () => {
  const { code, player } = useParams();
  const submitHumanAnswer = useMutation(api.game.submitHumanAnswer);
  const playerName = decodeURI(player as string);

  const game = useQuery(api.game.get, { code: code as string });
  const methods = useForm({
    resolver: yupResolver(answeringSchema),
  });

  const onSubmit = async (data: { answer: string }) => {
    console.log(data);
    await submitHumanAnswer({ code: code as string, name: playerName, answer: data.answer });
    methods.reset();
  };

  if (!game) {
    return <div>Loading...</div>;
  }

  const matchup = game.matchups.find((matchup) => {
    return (
      (matchup.player1 === playerName && !matchup.player1Answer) ||
      (matchup.player2 === playerName && !matchup.player2Answer)
    );
  });

  if (!matchup) {
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
            <TextareaField name="answer" label={matchup.prompt} />
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

  const game = useQuery(api.game.get, { code: code as string });

  const onSubmit = async (vote: string) => {
    await submitHumanVote({ code: code as string, name: playerName, vote });
  };

  if (!game) {
    return <div>Loading...</div>;
  }

  const matchup = game.matchups[game.matchup];

  if (
    matchup.player1 === playerName ||
    matchup.player2 === playerName ||
    matchup.votes1?.includes(playerName) ||
    matchup.votes2?.includes(playerName)
  ) {
    return (
      <div className="w-full flex flex-col justify-center items-center">
        <div>Waiting for other players to vote...</div>
        {(matchup.player1 === playerName || matchup.player2 === playerName) && (
          <div className="italic mt-2 text-xs">
            (You answered this prompt, so you can&apos;t vote on it)
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="w-full flex justify-center">
      <div className="p-4 w-full flex flex-col gap-4 max-w-md">
        <div className="w-full">{matchup.prompt}</div>
        {[matchup.player1Answer, matchup.player2Answer].map((answer) => (
          <div key={answer} className="w-full">
            <Button key={answer} onClick={() => answer && onSubmit(answer)} className="w-full">
              {answer}
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
};

const Reveal = () => {
  const { code, player } = useParams();
  const game = useQuery(api.game.get, { code: code as string });
  const nextMatchup = useMutation(api.game.nextMatchup);

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
        <div>Look at those results!</div>
      </div>
      {!isAdmin && (
        <div className="w-full flex justify-center italic mt-2 text-sm">
          <div>(Waiting for the admin to move forward)</div>
        </div>
      )}
      {isAdmin && (
        <div className="flex w-full justify-center mt-4">
          <Button className="w-fit" onClick={() => nextMatchup({ code: code as string })}>
            Next Matchup (only visible to you)
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
    <div className="flex flex-col items-center min-h-screen pb-20 gap-16 p-4 w-full justify-between relative">
      <div className="absolute inset-0 bg-[url('/bg.webp')] bg-cover bg-center opacity-5 z-0"></div>
      <div className="relative flex flex-col items-center min-h-screen gap-16 w-full justify-between">
        <div className="w-full">
          <div className="text-center text-sm text-gray-500 mb-4">
            <h1 className="text-base font-semibold">{game.name}</h1>
            <h2 className="text-xs">Playing as {human.name}</h2>
            {human.isAdmin && (
              <div className="text-xs italic font-semibold">(You are the game admin)</div>
            )}
          </div>

          <div className="flex flex-col gap-4 w-full mt-16">
            {(game.stage === GAME_STAGE.PLAYERS_JOINING ||
              game.stage === GAME_STAGE.GAME_STARTING) && <WaitToStart />}
            {game.stage === GAME_STAGE.ENTER_RESPONSES && <Answering />}
            {game.stage === GAME_STAGE.VOTING && <Voting />}
            {game.stage === GAME_STAGE.REVEAL && <Reveal />}

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

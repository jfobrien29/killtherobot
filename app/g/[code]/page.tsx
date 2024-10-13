/* eslint-disable @next/next/no-img-element */
/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';
import { useMutation, useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { useParams, useRouter } from 'next/navigation';
import QRCode from 'qrcode';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { GAME_STAGE } from '@/convex/game';
import { Bot, PersonStanding } from 'lucide-react';
import { HumanOrBot, Matchup, PlayerType } from '@/convex/schema';

const getPlayerssWhoGaveTwoAnswers = (game: any): string[] => {
  if (!game) return [];
  // First create a map of player name to number of answers
  const playerAnswerCount = game.matchups.reduce(
    (acc: Record<string, number>, matchup: Matchup) => {
      if (!!matchup.player1Answer) {
        acc[matchup.player1] = (acc[matchup.player1] || 0) + 1;
      }
      if (!!matchup.player2Answer) {
        acc[matchup.player2] = (acc[matchup.player2] || 0) + 1;
      }
      return acc;
    },
    {} as Record<string, number>,
  );

  console.log(playerAnswerCount);

  // Then filter the map to only include players who gave two answers
  return Object.keys(playerAnswerCount).filter((player) => playerAnswerCount[player] === 2);
};

export default function Home() {
  const { code } = useParams();
  const [qrCode, setQrCode] = useState<string | null>(null);
  const router = useRouter();
  // const setStage = useMutation(api.game.setStage);
  const nextMatchup = useMutation(api.game.nextMatchup);
  const restartGame = useMutation(api.game.restartGame);
  const game = useQuery(api.game.get, { code: code as string });
  const [origin, setOrigin] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setOrigin(window.location.origin);
    }
  }, []);

  const playersWhoGaveTwoAnswers = getPlayerssWhoGaveTwoAnswers(game);

  console.log(playersWhoGaveTwoAnswers);

  useEffect(() => {
    const generateQrCode = async () => {
      const qr = await QRCode.toDataURL(`${origin}/g/${code}/join`);
      setQrCode(qr);
    };

    generateQrCode();
  }, [code, origin]);

  return (
    <div className="flex flex-col items-center min-h-screen pb-20 gap-8 p-4 relative">
      <div className="absolute inset-0 bg-[url('/bg.png')] bg-cover bg-center opacity-5 z-0"></div>
      <div className="z-10 flex flex-col items-center min-h-screen gap-8 w-full">
        <div>
          <h2 className="text-xl font-extrabold text-center text-gray-500">
            Welcome to Kill The Robot
          </h2>
          <div className="text-sm text-gray-500 text-center">
            Visit <span className="font-semibold">{origin}</span>
          </div>
        </div>

        <div className="flex flex-col gap-2 items-center w-full max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold text-center text-gray-900">{game?.name}</h1>
          <div className="flex flex-col items-center gap-1 mt-2">
            <h2 className="text-xl  bg-gray-200 px-4 py-2 rounded-full">
              Join with code: <span className="font-mono font-semibold">{code}</span>
            </h2>
            {game?.stage === GAME_STAGE.GAME_STARTING && (
              <div className="text-sm text-gray-500">Game starting...</div>
            )}
            {game?.stage === GAME_STAGE.ENTER_RESPONSES && (
              <div className="text-sm text-gray-500">Enter responses...</div>
            )}
            {game?.stage === GAME_STAGE.VOTING && (
              <div className="text-sm text-gray-500">Voting...</div>
            )}
          </div>
        </div>

        {(game?.stage === GAME_STAGE.PLAYERS_JOINING ||
          game?.stage === GAME_STAGE.GAME_STARTING ||
          game?.stage === GAME_STAGE.ENTER_RESPONSES) && (
          <div className="flex gap-12 w-full items-center max-w-[1000px] transition-all duration-300">
            <div className="flex-1 flex flex-col gap-4">
              <div className="bg-white shadow-lg rounded-xl overflow-hidden transition-all hover:shadow-2xl border border-gray-300">
                <div className="bg-zinc-800 text-white text-xl font-semibold py-3 px-6">Humans</div>
                <div className="p-6">
                  {game?.humans.map((human) => (
                    <div key={human.name} className="text-lg mb-2 flex items-center text-gray-700">
                      <PersonStanding className="mr-2" /> {human.name}{' '}
                      {playersWhoGaveTwoAnswers.includes(human.name) && (
                        <span className="ml-2 text-green-500">👍</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white shadow-lg rounded-xl overflow-hidden transition-all hover:shadow-2xl border border-gray-300">
                <div className="bg-zinc-800 text-white text-xl font-semibold py-3 px-6">Bots</div>
                <div className="p-6">
                  {game?.bots.map((bot) => (
                    <div key={bot.name} className="text-lg mb-2 flex items-center text-gray-700">
                      <Bot className="mr-2" /> {bot.name}{' '}
                      {playersWhoGaveTwoAnswers.includes(bot.name) && (
                        <span className="ml-2 text-green-500">👍</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {game.stage === GAME_STAGE.PLAYERS_JOINING && (
              <div className="flex-1 flex flex-col items-center justify-center max-w-[400px]">
                {qrCode && <img src={qrCode} alt="QR Code" className="w-full h-auto" />}
              </div>
            )}
          </div>
        )}

        {(game?.stage === GAME_STAGE.VOTING || game?.stage === GAME_STAGE.REVEAL) && (
          <div className="w-full flex flex-col items-center">
            {game.matchup !== undefined && game.matchups && game.matchups[game.matchup] && (
              <div className="bg-white shadow-lg rounded-xl overflow-hidden transition-all border border-gray-300 mb-6 max-w-[800px] w-full">
                <div className="bg-zinc-800 text-white text-xl font-semibold py-3 px-6 w-full">
                  {game.matchups[game.matchup].prompt}
                </div>
                <div className="p-6 flex justify-between gap-4">
                  {[
                    {
                      answer: game.matchups[game.matchup].player1Answer,
                      name: game.matchups[game.matchup].player1,
                      type: game.matchups[game.matchup].player1Type,
                    },
                    {
                      answer: game.matchups[game.matchup].player2Answer,
                      name: game.matchups[game.matchup].player2,
                      type: game.matchups[game.matchup].player2Type,
                    },
                  ].map((item, index) => (
                    <div
                      key={index}
                      className="flex-1 p-6 rounded-lg shadow-md transform hover:scale-105 transition-all duration-300 flex flex-col justify-between w-full bg-gradient-to-br from-white to-gray-100"
                    >
                      {game.stage === GAME_STAGE.REVEAL && (
                        <div className="flex items-center justify-between border-b border-gray-300 pb-3 mb-4">
                          <p className="font-bold text-lg text-gray-800">{item.name}</p>
                          {item.type === PlayerType.HUMAN ? (
                            <PersonStanding size={24} />
                          ) : (
                            <Bot size={24} />
                          )}
                        </div>
                      )}
                      <div className="flex justify-center items-center w-full font-semibold text-xl text-gray-700 my-4 px-3 py-6 bg-white rounded-lg shadow-inner">
                        {item.answer}
                      </div>
                      {game.stage === GAME_STAGE.REVEAL && (
                        <div className="flex justify-center items-center mt-4">
                          <div className="w-full bg-blue-50 border border-blue-200 rounded-lg p-4 shadow-sm animate-fadeIn duration-1000">
                            <span className="font-semibold text-blue-800 mb-2">Votes:</span>{' '}
                            <span className="text-sm text-gray-600 italic">
                              {item.answer === game.matchups[game.matchup].player1Answer
                                ? game.matchups[game.matchup].votes1
                                    ?.filter((n) => n !== item.name)
                                    .join(', ')
                                : game.matchups[game.matchup].votes2
                                    ?.filter((n) => n !== item.name)
                                    .join(', ')}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {game?.stage === GAME_STAGE.REVEAL && (
              <div className="flex justify-center pb-8">
                <Button onClick={() => nextMatchup({ code: code as string })}>Next Matchup</Button>
              </div>
            )}

            <div className="bg-white shadow-lg rounded-xl overflow-hidden transition-all hover:shadow-2xl border border-gray-300 mb-6 max-w-[800px] w-full">
              <div className="bg-zinc-800 text-white text-xl font-semibold py-3 px-6">Players</div>
              <div className="p-6">
                {game?.humans.map((human) => (
                  <div key={human.name} className="text-lg mb-2 flex items-center text-gray-700">
                    <PersonStanding className="mr-2" /> {human.name}
                    {(game.matchups[game.matchup].votes1!.includes(human.name) ||
                      game.matchups[game.matchup].votes2!.includes(human.name)) && (
                      <span className="ml-2 text-green-500">👍</span>
                    )}
                  </div>
                ))}
                {/* {game?.bots.map((bot) => (
                  <div key={bot.name} className="text-lg mb-2 flex items-center text-gray-700">
                    <Bot className="mr-2" /> {bot.name}
                    {(game.matchups[game.matchup].votes1!.includes(bot.name) ||
                      game.matchups[game.matchup].votes2!.includes(bot.name)) && (
                      <span className="ml-2 text-green-500">👍</span>
                    )}
                  </div>
                ))} */}
              </div>
            </div>
          </div>
        )}

        {game?.stage === GAME_STAGE.SHOW_RANKINGS && (
          <div>
            <div className="w-full max-w-4xl">
              <h2 className="text-2xl font-bold mb-4 text-center">Final Rankings</h2>
              <div className="bg-white shadow-lg rounded-xl overflow-hidden p-4 border border-gray-300 w-full">
                {(game.humans as HumanOrBot[])
                  .map((h) => ({ ...h, type: PlayerType.HUMAN }))
                  .concat(game.bots.map((b) => ({ ...b, type: PlayerType.BOT })))
                  .sort((a, b) => b.score - a.score)
                  .map((player, index) => (
                    <div
                      key={player.name}
                      className={`flex gap-2 items-center justify-between py-3 px-4 min-w-[400px]  ${
                        index % 2 === 1 ? 'bg-gray-50' : 'bg-white'
                      }`}
                    >
                      <div className="flex items-center space-x-4">
                        <span className="text-lg text-gray-600">{index + 1}.</span>
                        <span className="text-gray-500">
                          {player.type === PlayerType.HUMAN ? (
                            <PersonStanding className="inline w-5 h-5" />
                          ) : (
                            <Bot className="inline w-5 h-5" />
                          )}
                        </span>
                        <span className="text-base">{player.name}</span>
                      </div>
                      <span className="text-base text-gray-700">{player.score} points</span>
                    </div>
                  ))}
              </div>
            </div>
            <div className="flex flex-col gap-2 max-w-2xl w-full">
              <div className="flex justify-center">
                <Button className="mt-4 w-full" onClick={() => router.push('/create')}>
                  New Game (with new theme)
                </Button>
              </div>
              <div className="flex justify-center">
                <Button
                  variant="outline"
                  className="mt-4 w-full"
                  onClick={() => restartGame({ code: code as string })}
                >
                  Restart Game (with same theme)
                </Button>
              </div>
            </div>
          </div>
        )}

        {game?.stage === GAME_STAGE.GAME_OVER && <div>Game Over</div>}

        {/* <code className="mt-64 whitespace-pre max-w-[1000px]">{JSON.stringify(game, null, 2)}</code> */}

        {/* <div className="mt-48 flex gap-2">
        <Button
          onClick={() => setStage({ code: code as string, stage: GAME_STAGE.PLAYERS_JOINING })}
        >
          Players Joining
        </Button>
        <Button onClick={() => setStage({ code: code as string, stage: GAME_STAGE.GAME_STARTING })}>
          Game Starting
        </Button>
        <Button
          onClick={() => setStage({ code: code as string, stage: GAME_STAGE.ENTER_RESPONSES })}
        >
          Enter Responses
        </Button>
        <Button onClick={() => setStage({ code: code as string, stage: GAME_STAGE.VOTING })}>
          VOTING
        </Button>
        <Button onClick={() => setStage({ code: code as string, stage: GAME_STAGE.SHOW_RANKINGS })}>
          Show Rankings
        </Button>
        <Button onClick={() => setStage({ code: code as string, stage: GAME_STAGE.GAME_OVER })}>
          GAME_OVER
        </Button>
        <Button onClick={() => setStage({ code: code as string, stage: GAME_STAGE.PAUSED })}>
          Paused
        </Button>
      </div> */}
      </div>
    </div>
  );
}

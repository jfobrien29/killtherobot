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
import { HumanOrBot, PlayerType } from '@/convex/schema';
import clsx from 'clsx';

// const getPlayerssWhoGaveTwoAnswers = (game: any): string[] => {
//   if (!game) return [];
//   // First create a map of player name to number of answers
//   const playerAnswerCount = game.matchups.reduce(
//     (acc: Record<string, number>, matchup: Matchup) => {
//       if (!!matchup.player1Answer) {
//         acc[matchup.player1] = (acc[matchup.player1] || 0) + 1;
//       }
//       if (!!matchup.player2Answer) {
//         acc[matchup.player2] = (acc[matchup.player2] || 0) + 1;
//       }
//       return acc;
//     },
//     {} as Record<string, number>,
//   );

//   console.log(playerAnswerCount);

//   // Then filter the map to only include players who gave two answers
//   return Object.keys(playerAnswerCount).filter((player) => playerAnswerCount[player] === 2);
// };

export default function Home() {
  const { code } = useParams();
  const [qrCode, setQrCode] = useState<string | null>(null);
  const router = useRouter();
  // const setStage = useMutation(api.game.setStage);
  const nextRound = useMutation(api.game.nextRound);
  const restartGame = useMutation(api.game.restartGame);
  const game = useQuery(api.game.get, { code: code as string });
  const [origin, setOrigin] = useState<string | null>(null);

  const currentRound = game?.rounds[game?.currentRound];

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setOrigin(window.location.origin);
    }
  }, []);

  // const playersWhoGaveTwoAnswers = getPlayerssWhoGaveTwoAnswers(game);

  // console.log(playersWhoGaveTwoAnswers);

  useEffect(() => {
    const generateQrCode = async () => {
      const qr = await QRCode.toDataURL(`${origin}/g/${code}/join`);
      setQrCode(qr);
    };

    generateQrCode();
  }, [code, origin]);

  return (
    <div className="flex flex-col items-center min-h-screen pb-20 gap-8 p-4 relative">
      <div className="absolute inset-0 bg-[url('/bg.webp')] bg-cover bg-center opacity-5 z-0"></div>
      <div className="z-10 flex flex-col items-center min-h-screen gap-8 w-full">
        <div>
          <div className="text-sm text-gray-500 text-center">
            Visit{' '}
            <a className="font-semibold" href={`${origin || ''}/g/${code}/join`} target="_blank">
              {origin}
            </a>
          </div>
          <h2 className="text-sm  bg-gray-200 px-2 py-1 rounded-full">
            Join with code: <span className="font-mono font-semibold">{code}</span>
          </h2>
        </div>

        <div className="flex flex-col gap-2 items-center w-full max-w-4xl mx-auto">
          <h1 className="text-6xl font-bold text-center text-gray-900">Kill The Robot</h1>
          <h2 className="text-2xl font-bold text-center text-gray-900 italic">
            {game?.name || 'Get them bots!'}
          </h2>
          <div className="flex flex-col items-center gap-1 mt-2">
            {game?.stage === GAME_STAGE.GAME_STARTING && (
              <div className="text-sm text-gray-500">Game starting...</div>
            )}
            {game?.stage === GAME_STAGE.ENTER_RESPONSES && (
              <div className="text-sm text-gray-500">Enter responses...</div>
            )}
            {game?.stage === GAME_STAGE.VOTING && (
              <div className="text-sm text-gray-500">Voting...</div>
            )}
            {game?.stage === GAME_STAGE.REVEAL && (
              <div className="text-sm text-gray-500">Reveal!</div>
            )}
            {game?.stage === GAME_STAGE.GAME_OVER && (
              <div className="text-sm text-gray-500">Game Over!</div>
            )}
          </div>
        </div>

        {game?.stage === GAME_STAGE.NEXT_ROUND_LOADING && (
          <div className="text-sm text-gray-500">Loading next round...</div>
        )}

        {(game?.stage === GAME_STAGE.PLAYERS_JOINING ||
          game?.stage === GAME_STAGE.GAME_STARTING ||
          game?.stage === GAME_STAGE.ENTER_RESPONSES) && (
          <div className="flex gap-12 w-full items-center max-w-[1000px] transition-all duration-300">
            <div className="flex-1 flex flex-col gap-4">
              <div className="bg-white shadow-lg rounded-xl overflow-hidden transition-all hover:shadow-2xl border border-gray-300">
                <div className="bg-zinc-800 text-white text-xl font-semibold py-3 px-6">Humans</div>
                <div className="p-6">
                  {game?.humans.map((human) => (
                    <div key={human.name} className="text-lg mb-2 flex items-center text-gray-700 ">
                      <PersonStanding className="mr-2" />{' '}
                      <span className={clsx(!human.isAlive && 'line-through')}>{human.name}</span>{' '}
                      {currentRound?.answers
                        .map((answer) => answer.name)
                        .flat()
                        .includes(human.name) && <span className="ml-2 text-green-500">👍</span>}
                      {!human.isAlive && (
                        <span className="ml-2" title="Eliminated">
                          💀
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white shadow-lg rounded-xl overflow-hidden transition-all hover:shadow-2xl border border-gray-300">
                <div className="bg-zinc-800 text-white text-xl font-semibold py-3 px-6">Robots</div>
                <div className="p-6">
                  {game?.bots.map((bot) => (
                    <div key={bot.name} className="text-lg mb-2 flex items-center text-gray-700">
                      <Bot className="mr-2" />{' '}
                      <span className={clsx(!bot.isAlive && 'line-through')}>{bot.name}</span>{' '}
                      {currentRound?.answers
                        .map((answer) => answer.name)
                        .flat()
                        .includes(bot.name) && <span className="ml-2 text-green-500">👍</span>}
                      {!bot.isAlive && (
                        <span className="ml-2" title="Eliminated">
                          💀
                        </span>
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
            {game.stage === GAME_STAGE.ENTER_RESPONSES && (
              <div className="flex-1 flex flex-col items-center justify-center max-w-[400px] bg-gradient-to-r from-blue-100 to-purple-100 p-8 rounded-xl shadow-lg">
                <h2 className="text-xl font-bold text-center text-gray-800 mb-4">
                  Current Question:
                </h2>
                <p className="text-2xl text-center text-gray-700 italic">
                  {currentRound?.question}
                </p>
                <div className="mt-6 w-16 h-1 bg-indigo-500 rounded-full"></div>
              </div>
            )}
          </div>
        )}

        {(game?.stage === GAME_STAGE.VOTING || game?.stage === GAME_STAGE.REVEAL) && (
          <div className="w-full flex flex-col items-center">
            {currentRound && (
              <div className="bg-white shadow-lg rounded-xl overflow-hidden transition-all border border-gray-300 mb-6 max-w-[1000px] w-full">
                <div className="bg-zinc-800 text-white text-xl font-semibold py-3 px-6 w-full">
                  {currentRound?.question}
                </div>
                <div className="p-6 gap-4 grid grid-cols-3">
                  {currentRound.answers.map((item, index) => (
                    <div
                      key={index}
                      className={clsx(
                        'flex-1 p-6 rounded-lg shadow-md transform hover:scale-105 transition-all duration-300 flex flex-col justify-between w-full bg-gradient-to-br from-white to-gray-100',
                      )}
                    >
                      <div
                        className={clsx(
                          'flex flex-col justify-center items-center w-full font-semibold text-xl text-gray-700 my-4 px-3 py-6  rounded-lg shadow-inner',
                          item.name === currentRound?.eliminatedPlayer ? 'bg-red-500' : 'bg-white',
                        )}
                      >
                        <div>{item.text}</div>
                        {game.stage === GAME_STAGE.REVEAL &&
                          item.name === currentRound?.eliminatedPlayer && (
                            <div className="flex items-center mt-2 text-sm font-normal gap-1">
                              {item.name} -{' '}
                              {game.humans.some((human) => human.name === item.name) ? (
                                <PersonStanding className="inline-block mr-1" />
                              ) : (
                                <Bot className="inline-block mr-1" />
                              )}
                            </div>
                          )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {game?.stage === GAME_STAGE.REVEAL && (
              <div className="flex justify-center pb-8">
                <Button onClick={() => nextRound({ code: code as string })}>Next Round</Button>
              </div>
            )}

            <div className="bg-white shadow-lg rounded-xl overflow-hidden transition-all hover:shadow-2xl border border-gray-300 mb-6 max-w-[800px] w-full">
              <div className="bg-zinc-800 text-white text-xl font-semibold py-3 px-6">
                Human Players
              </div>
              <div className="p-6">
                {game?.humans.map((human) => (
                  <div key={human.name} className="text-lg mb-2 flex items-center text-gray-700">
                    <PersonStanding className="mr-2" />{' '}
                    <span className={clsx(!human.isAlive && 'line-through')}>{human.name}</span>{' '}
                    {currentRound?.answers
                      .map((answer) => answer.votes)
                      .flat()
                      .includes(human.name) && <span className="ml-2 text-green-500">👍</span>}
                    {!human.isAlive && <span className="ml-2 text-red-500">💀</span>}
                  </div>
                ))}
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

        {game?.stage === GAME_STAGE.GAME_OVER && (
          <div className="w-full max-w-4xl">
            <h2 className="text-3xl font-bold mb-6 text-center">Game Over</h2>
            <div className="bg-white shadow-lg rounded-xl overflow-hidden p-6 border border-gray-300">
              <h3 className="text-2xl font-semibold mb-4 text-center">
                {game.bots.every((bot) => !bot.isAlive) ? 'Humans Won!' : 'The Robots Won!'}
              </h3>
              <div className="text-center text-lg">
                {game.humans.filter((human) => human.isAlive).length === 1 ? (
                  <p>Only one human left standing. The bots have taken over!</p>
                ) : (
                  <p>All bots have been eliminated. Humanity prevails!</p>
                )}
              </div>
              <div className="mb-6 bg-green-100 rounded-lg p-6 shadow-md mt-2">
                <h4 className="text-2xl font-semibold mb-4 text-center">Live Players</h4>
                <div className="flex justify-center">
                  <div className="grid grid-cols-2 gap-x-8">
                    {[...game.humans, ...game.bots]
                      .filter((player: any) => player.isAlive)
                      .map((player: any, index: any) => (
                        <div
                          key={player.name}
                          className={`text-lg flex items-center justify-center space-x-2 ${
                            index % 2 === 0 ? 'justify-end' : 'justify-start'
                          }`}
                        >
                          <span>{player.name}</span>
                          <span className="text-sm text-gray-500">
                            {player.hasOwnProperty('isAdmin') ? (
                              <PersonStanding className="inline w-4 h-4 ml-1" />
                            ) : (
                              <Bot className="inline w-4 h-4 ml-1" />
                            )}
                          </span>
                        </div>
                      ))}
                  </div>
                </div>
              </div>
              <div className="mb-6 bg-red-100 rounded-lg p-6 shadow-md">
                <h4 className="text-2xl font-semibold mb-4 text-center">Eliminated Players</h4>
                <div className="flex justify-center">
                  <div className="grid grid-cols-2 gap-x-8">
                    {[...game.humans, ...game.bots]
                      .filter((player) => !player.isAlive)
                      .map((player, index) => (
                        <div
                          key={player.name}
                          className={`text-lg flex items-center justify-center space-x-2 ${
                            index % 2 === 0 ? 'justify-end' : 'justify-start'
                          }`}
                        >
                          <span>{player.name}</span>
                          <span className="text-sm text-gray-500">
                            {player.hasOwnProperty('isAdmin') ? (
                              <PersonStanding className="inline w-4 h-4 ml-1" />
                            ) : (
                              <Bot className="inline w-4 h-4 ml-1" />
                            )}
                          </span>
                        </div>
                      ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        <code className="mt-64 whitespace-pre max-w-[1000px]">{JSON.stringify(game, null, 2)}</code>

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

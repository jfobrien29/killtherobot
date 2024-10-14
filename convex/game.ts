/* eslint-disable @typescript-eslint/no-explicit-any */
import { v } from 'convex/values';
import { internalMutation, internalQuery, mutation, query } from './_generated/server';
import { internal } from './_generated/api';

const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

export enum GAME_STAGE {
  PLAYERS_JOINING = 'PLAYERS_JOINING', // players are joining
  GAME_STARTING = 'GAME_STARTING', // game is starting, create matchups and set prompts
  ENTER_RESPONSES = 'ENTER_RESPONSES', // players enter their responses
  VOTING = 'VOTING', // players vote on the best response, responses shown head to head
  NEXT_ROUND_LOADING = 'NEXT_ROUND_LOADING', // next round is loading
  REVEAL = 'REVEAL', // reveal the winner of the vote
  PAUSED = 'PAUSED', // game is paused
  SHOW_RANKINGS = 'SHOW_RANKINGS', // show the rankings (in between rounds)
  GAME_OVER = 'GAME_OVER', // game is over (winner is the player with the most points)
}

const BOT_NAMES = ['Ada', 'Eliza', 'John', 'Alan', 'Grace', 'Tim'];
const getThreeRandomBots = () => {
  // Create a copy of the bot name array
  const names = [...BOT_NAMES];

  // now shuffle it
  names.sort(() => Math.random() - 0.5);

  return names.slice(0, 2);
};

export const get = query({
  args: { code: v.string() },
  handler: async (ctx, { code }) => {
    const game = await ctx.db
      .query('games')
      .filter((q) => q.eq(q.field('code'), code))
      .first();
    return game;
  },
});

const generateCode = () => {
  return Array.from(
    { length: 6 },
    () => alphabet[Math.floor(Math.random() * alphabet.length)],
  ).join('');
};

export const create = mutation({
  args: { name: v.string() },
  handler: async (ctx, { name }) => {
    const code = generateCode();

    const threeBots = getThreeRandomBots();

    const gameId = await ctx.db.insert('games', {
      name: name,
      theme: name,
      code,
      stage: GAME_STAGE.PLAYERS_JOINING,
      humans: [],
      bots: threeBots.map((name) => ({
        name,
        score: 0,
        isAlive: true,
        config: '',
      })),
      rounds: [],
      currentRound: 0,
    });

    console.log('gameId', gameId);

    await ctx.scheduler.runAfter(0, internal.ai.generateQuestionsForGame, {
      gameId: gameId,
      theme: name,
      restart: false,
    });

    return code;
  },
});

export const finishInitialSetup = internalMutation({
  args: { gameId: v.id('games'), name: v.string(), question: v.string() },
  handler: async (ctx, { gameId, name, question }) => {
    await ctx.db.patch(gameId, {
      name,
      rounds: [
        {
          question: question,
          answers: [],
          eliminatedPlayer: '',
        },
      ],
    });
  },
});

export const join = mutation({
  args: { code: v.string(), name: v.string() },
  handler: async (ctx, { code, name }) => {
    const game = await ctx.db
      .query('games')
      .filter((q) => q.eq(q.field('code'), code))
      .first();

    if (!game) {
      throw new Error('Game not found');
    }

    const humans = game.humans;

    if (humans.some((human) => human.name === name)) {
      console.log('human already in game');
      return;
    }

    if (game.stage !== GAME_STAGE.PLAYERS_JOINING) {
      throw new Error('Game is not in players joining stage');
    }

    if (humans.length >= 6) {
      throw new Error('Game is full');
    }

    humans.push({
      name,
      score: 0,
      isAdmin: humans.length === 0,
      isAlive: true,
    });

    await ctx.db.patch(game._id, {
      humans,
    });
  },
});

export const start = mutation({
  args: { code: v.string(), name: v.string() },
  handler: async (ctx, { code, name }) => {
    const game = await ctx.db
      .query('games')
      .filter((q) => q.eq(q.field('code'), code))
      .first();

    if (!game) {
      throw new Error('Game not found');
    }

    const human = game.humans.find((human) => human.name === name);
    if (!human || !human.isAdmin) {
      throw new Error('Human not found or not admin');
    }

    // now change the game state to game starting
    await ctx.db.patch(game._id, {
      stage: GAME_STAGE.GAME_STARTING,
    });

    // TODO: could add more bots here

    // TODO: could generate the first round here

    // Now the game is ready to start!
    await ctx.db.patch(game._id, {
      stage: GAME_STAGE.ENTER_RESPONSES,
    });

    // Now we need to create answers for the bots
    await ctx.scheduler.runAfter(1000, internal.ai.botCreateAnswers, {
      gameId: game._id,
    });
  },
});

export const updateWithBotsAnswers = internalMutation({
  args: {
    gameId: v.id('games'),
    answers: v.array(v.object({ name: v.string(), text: v.string() })),
  },
  handler: async (ctx, { gameId, answers }) => {
    const game = await ctx.runQuery(internal.game.getGameById, {
      gameId,
    });

    if (!game) {
      throw new Error('Game not found');
    }

    const currentRound = game.rounds[game.currentRound];

    // Add in the robot answers
    await ctx.db.patch(game._id, {
      rounds: [
        ...game.rounds.slice(0, game.currentRound),
        {
          ...currentRound,
          answers: [
            ...currentRound.answers,
            ...answers.map((answer) => ({ ...answer, votes: [] })),
          ],
        },
      ],
    });
  },
});

export const getGameById = internalQuery({
  args: { gameId: v.id('games') },
  handler: async (ctx, { gameId }) => {
    const game = await ctx.db.get(gameId);
    return game;
  },
});

export const submitHumanAnswer = mutation({
  args: { code: v.string(), name: v.string(), answer: v.string() },
  handler: async (ctx, { code, name, answer }) => {
    const game = await ctx.db
      .query('games')
      .withIndex('by_code', (q) => q.eq('code', code))
      .first();

    if (!game) {
      throw new Error('Game not found');
    }

    const currentRound = game.rounds[game.currentRound];

    // Add in the human answer
    await ctx.db.patch(game._id, {
      rounds: [
        ...game.rounds.slice(0, game.currentRound),
        {
          ...currentRound,
          answers: [
            ...currentRound.answers,
            {
              name,
              text: answer,
              votes: [],
            },
          ],
        },
      ],
    });

    // Now we need to check if all answers are in
    await ctx.runMutation(internal.game.checkIfAllAnswersAreIn, {
      gameId: game._id,
    });
  },
});

export const checkIfAllAnswersAreIn = internalMutation({
  args: { gameId: v.id('games') },
  handler: async (ctx, { gameId }) => {
    const game = await ctx.db.get(gameId);

    if (!game) {
      throw new Error('Game not found');
    }

    // If all answers are in, we need to move to the voting stage
    const numHumans = game.humans.filter((human) => human.isAlive).length;
    const numBots = game.bots.filter((bot) => bot.isAlive).length;
    const currentRound = game.rounds[game.currentRound];
    const shuffledAnswers = [...currentRound.answers].sort(() => Math.random() - 0.5);

    const totalAlive = numHumans + numBots;
    if (currentRound.answers.length === totalAlive) {
      await ctx.db.patch(game._id, {
        stage: GAME_STAGE.VOTING,

        rounds: [
          ...game.rounds.slice(0, game.currentRound),
          {
            ...currentRound,
            answers: shuffledAnswers,
          },
          ...game.rounds.slice(game.currentRound + 1),
        ],
      });
    }
  },
});

export const vote = mutation({
  args: { code: v.string(), name: v.string(), votes: v.array(v.string()) },
  handler: async (ctx, { code, name, votes }) => {
    const game = await ctx.db
      .query('games')
      .withIndex('by_code', (q) => q.eq('code', code))
      .first();

    if (!game) {
      throw new Error('Game not found');
    }

    // Add in the vote for the answer
    const currentRound = game.rounds[game.currentRound];

    // Add my vote to the answer
    await ctx.db.patch(game._id, {
      rounds: [
        ...game.rounds.slice(0, game.currentRound),
        {
          ...currentRound,
          answers: currentRound.answers.map((answer) =>
            votes.includes(answer.text) ? { ...answer, votes: [...answer.votes, name] } : answer,
          ),
        },
      ],
    });

    await ctx.scheduler.runAfter(0, internal.game.checkIfAllVotesAreIn, {
      gameId: game._id,
    });
  },
});

export const checkIfAllVotesAreIn = internalMutation({
  args: { gameId: v.id('games') },
  handler: async (ctx, { gameId }) => {
    const game = await ctx.db.get(gameId);

    if (!game) {
      throw new Error('Game not found');
    }

    const numAliveHumans = game.humans.filter((human) => human.isAlive).length;
    const currentRound = game.rounds[game.currentRound]!;

    // Add up the number of votes accross all answers in the current round
    const totalVotes = currentRound.answers.map((answer) => answer.votes).flat().length;

    console.log('totalVotes', totalVotes);
    console.log('numAliveHumans', numAliveHumans);
    if (totalVotes === numAliveHumans * 2 && game.stage === GAME_STAGE.VOTING) {
      // Do processing on who lost here
      let losingAnswerAmount = currentRound.answers[0].votes.length;
      for (const answer of currentRound.answers) {
        if (answer.votes.length > losingAnswerAmount) {
          losingAnswerAmount = answer.votes.length;
        }
      }

      // Now put any ties in an array
      const tiedAnswers = currentRound.answers.filter(
        (answer) => answer.votes.length === losingAnswerAmount,
      );

      let losingAnswer: any;
      if (tiedAnswers.length > 1) {
        // There were ties, pick the first non-bot answer (or the first answer if all are bots)
        losingAnswer =
          tiedAnswers.find((answer) => !game.bots.some((bot) => bot?.name === answer?.name)) ||
          tiedAnswers[0];
      } else {
        // If no ties, it's the first
        losingAnswer = tiedAnswers[0];
      }

      const isLoserHuman = game.humans.some((human) => human.name === losingAnswer.name);

      if (isLoserHuman) {
        // Mark the losing player as dead
        await ctx.db.patch(game._id, {
          humans: game.humans.map((human) =>
            human.name === losingAnswer.name ? { ...human, isAlive: false } : human,
          ),
          rounds: [
            ...game.rounds.slice(0, game.currentRound),
            {
              ...currentRound,
              eliminatedPlayer: losingAnswer.name,
            },
          ],
        });
      } else {
        // Mark the losing bot as dead
        await ctx.db.patch(game._id, {
          bots: game.bots.map((bot) =>
            bot.name === losingAnswer.name ? { ...bot, isAlive: false } : bot,
          ),
          rounds: [
            ...game.rounds.slice(0, game.currentRound),
            {
              ...currentRound,
              eliminatedPlayer: losingAnswer.name,
            },
          ],
        });
      }

      const updatedGame = await ctx.db.get(game._id);

      if (!updatedGame) {
        throw new Error('Game not found');
      }

      // Determine if the robots won or not
      const numBotsAlive = updatedGame.bots.filter((bot) => bot.isAlive).length;
      const numHumansAlive = updatedGame.humans.filter((human) => human.isAlive).length;

      if (numBotsAlive === 0) {
        await ctx.db.patch(updatedGame._id, {
          stage: GAME_STAGE.GAME_OVER,
        });
        return;
      } else if (numHumansAlive <= 1) {
        await ctx.db.patch(updatedGame._id, {
          stage: GAME_STAGE.GAME_OVER,
        });
        return;
      }

      // We can move to the reveal stage
      await ctx.db.patch(updatedGame._id, {
        stage: GAME_STAGE.REVEAL,
      });
    }
  },
});

export const nextRound = mutation({
  args: { code: v.string() },
  handler: async (ctx, { code }) => {
    const game = await ctx.db
      .query('games')
      .withIndex('by_code', (q) => q.eq('code', code))
      .first();

    if (!game) {
      throw new Error('Game not found');
    }

    await ctx.db.patch(game._id, {
      stage: GAME_STAGE.NEXT_ROUND_LOADING,
    });

    await ctx.scheduler.runAfter(0, internal.ai.generateNextQuestionForGame, {
      gameId: game._id,
    });
  },
});

export const finishNextRoundLoading = internalMutation({
  args: { gameId: v.id('games'), question: v.string() },
  handler: async (ctx, { gameId, question }) => {
    const game = await ctx.db.get(gameId);

    if (!game) {
      throw new Error('Game not found');
    }

    await ctx.db.patch(gameId, {
      rounds: [
        ...game.rounds,
        {
          question: question,
          answers: [],
          eliminatedPlayer: '',
        },
      ],
      currentRound: game.currentRound + 1,
      stage: GAME_STAGE.ENTER_RESPONSES,
    });
  },
});

export const adminSkip = mutation({
  args: { code: v.string() },
  handler: async (ctx, { code }) => {
    const game = await ctx.db
      .query('games')
      .withIndex('by_code', (q) => q.eq('code', code))
      .first();

    if (!game) {
      throw new Error('Game not found');
    }

    if (game.stage === GAME_STAGE.ENTER_RESPONSES) {
      await ctx.db.patch(game._id, {
        stage: GAME_STAGE.VOTING,
      });
    } else if (game.stage === GAME_STAGE.VOTING) {
      await ctx.db.patch(game._id, {
        stage: GAME_STAGE.REVEAL,
      });
    }
  },
});

export const restartGame = mutation({
  args: { code: v.string() },
  handler: async (ctx, { code }) => {
    const game = await ctx.db
      .query('games')
      .withIndex('by_code', (q) => q.eq('code', code))
      .first();

    if (!game) {
      throw new Error('Game not found');
    }

    await ctx.db.patch(game._id, {
      stage: GAME_STAGE.GAME_STARTING,
    });

    await ctx.scheduler.runAfter(0, internal.ai.generateQuestionsForGame, {
      gameId: game._id,
      theme: game.theme,
      restart: true,
    });
  },
});

export const finishRestartGame = internalMutation({
  args: { gameId: v.id('games') },
  handler: async (ctx, { gameId }) => {
    const game = await ctx.db.get(gameId);

    if (!game) {
      throw new Error('Game not found');
    }
  },
});

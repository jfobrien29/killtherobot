import { v } from 'convex/values';
import { internalMutation, internalQuery, mutation, query } from './_generated/server';
import { internal } from './_generated/api';

const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

export enum GAME_STAGE {
  PLAYERS_JOINING = 'PLAYERS_JOINING', // players are joining
  GAME_STARTING = 'GAME_STARTING', // game is starting, create matchups and set prompts
  ENTER_RESPONSES = 'ENTER_RESPONSES', // players enter their responses
  VOTING = 'VOTING', // players vote on the best response, responses shown head to head
  REVEAL = 'REVEAL', // reveal the winner of the vote
  PAUSED = 'PAUSED', // game is paused
  SHOW_RANKINGS = 'SHOW_RANKINGS', // show the rankings (in between rounds)
  GAME_OVER = 'GAME_OVER', // game is over (winner is the player with the most points)
}

const BOT_NAMES = ['Ada', 'Eliza', 'John', 'Alan', 'Grace', 'Tim'];
const getARandomBotName = (notThisOne?: string) => {
  const name = BOT_NAMES[Math.floor(Math.random() * BOT_NAMES.length)];
  if (name === notThisOne) {
    return getARandomBotName(notThisOne);
  }
  return name;
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
  args: { theme: v.string() },
  handler: async (ctx, { theme }) => {
    const code = generateCode();
    const gameId = await ctx.db.insert('games', {
      name: theme,
      theme: theme,
      code,
      stage: GAME_STAGE.PLAYERS_JOINING,
      humans: [],
      bots: [],
      // bots: [
      //   {
      //     name: getARandomBotName(),
      //     score: 0,
      //     isAlive: true,
      //   },
      // ],
    });

    await ctx.scheduler.runAfter(0, internal.ai.generateQuestionsForGame, {
      gameId: gameId,
      theme,
      restart: false,
    });

    return code;
  },
});

export const finishInitialSetup = internalMutation({
  args: { gameId: v.id('games'), name: v.string() },
  handler: async (ctx, { gameId, name }) => {
    await ctx.db.patch(gameId, {
      name,
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

    // First let's decide how many bots we want. If 3 or less only great 1 bot. 4-6 another.
    const numHumans = game.humans.length;

    const bots = game.bots;
    if (numHumans >= 4) {
      bots.push({
        name: getARandomBotName(bots[0].name),
        score: 0,
        isAlive: true,
      });
      await ctx.db.patch(game._id, {
        bots,
      });
    }

    // now create the matchups

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

export const getGameById = internalQuery({
  args: { gameId: v.id('games') },
  handler: async (ctx, { gameId }) => {
    const game = await ctx.db.get(gameId);
    return game;
  },
});

export const submitHumanAnswer = mutation({
  args: { code: v.string(), name: v.string(), answer: v.string() },
  handler: async (ctx, { code }) => {
    const game = await ctx.db
      .query('games')
      .withIndex('by_code', (q) => q.eq('code', code))
      .first();

    if (!game) {
      throw new Error('Game not found');
    }
  },
});

export const checkIfAllAnswersAreIn = internalMutation({
  args: { gameId: v.id('games') },
  handler: async (ctx, { gameId }) => {
    const game = await ctx.db.get(gameId);

    if (!game) {
      throw new Error('Game not found');
    }
  },
});

export const voteForSelf = internalMutation({
  args: { gameId: v.id('games') },
  handler: async (ctx, { gameId }) => {
    const game = await ctx.db.get(gameId);

    if (!game) {
      throw new Error('Game not found');
    }
  },
});

// Admin controls OR if timer runs out
export const setStage = mutation({
  args: { code: v.string(), stage: v.string() },
  handler: async (ctx, { code, stage }) => {
    const game = await ctx.db
      .query('games')
      .withIndex('by_code', (q) => q.eq('code', code))
      .first();

    if (!game) {
      throw new Error('Game not found');
    }

    await ctx.db.patch(game._id, {
      stage,
    });
  },
});

export const vote = mutation({
  args: { code: v.string(), name: v.string(), vote: v.string() },
  handler: async (ctx, { code }) => {
    const game = await ctx.db
      .query('games')
      .withIndex('by_code', (q) => q.eq('code', code))
      .first();

    if (!game) {
      throw new Error('Game not found');
    }
  },
});

export const checkIfAllVotesAreIn = internalMutation({
  args: { gameId: v.id('games') },
  handler: async (ctx, { gameId }) => {
    const game = await ctx.db.get(gameId);

    if (!game) {
      throw new Error('Game not found');
    }
  },
});

export const nextMatchup = mutation({
  args: { code: v.string() },
  handler: async (ctx, { code }) => {
    const game = await ctx.db
      .query('games')
      .withIndex('by_code', (q) => q.eq('code', code))
      .first();

    if (!game) {
      throw new Error('Game not found');
    }
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

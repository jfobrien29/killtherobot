import { ConvexError, v } from 'convex/values';
import OpenAI from 'openai';
import { internalAction } from './_generated/server';
import { internal } from './_generated/api';
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic();

const openai = new OpenAI();

interface Answer {
  name: string;
  text: string;
}

const DEFAULT_ANSWERS = [
  'Im not the robot!',
  'Please please please dont kill me',
  'I. am. not. a. robot.',
];

const getRandomAnswer = () => {
  return DEFAULT_ANSWERS[Math.floor(Math.random() * DEFAULT_ANSWERS.length)];
};

export const botCreateAnswers = internalAction({
  args: { gameId: v.id('games') },
  handler: async (ctx, { gameId }) => {
    const game = await ctx.runQuery(internal.game.getGameById, {
      gameId,
    });
    if (!game) {
      throw new ConvexError('Game not found');
    }

    // TODO: This is where we would create answers for the bots
    // Send out response and expect an array of answer back

    const answers: Answer[] = game.bots.map((bot) => ({
      name: bot.name,
      text: getRandomAnswer(),
    }));

    await ctx.runMutation(internal.game.updateWithBotsAnswers, {
      gameId,
      answers,
    });
  },
});

export const generateQuestionsForGame = internalAction({
  args: { gameId: v.id('games'), theme: v.string(), restart: v.boolean() },
  handler: async (ctx, { gameId, theme, restart }) => {
    const game = await ctx.runQuery(internal.game.getGameById, {
      gameId,
    });

    if (!game) {
      throw new ConvexError('Game not found');
    }

    const name = await generateNameForGame(theme || 'Anything that comes to mind');

    if (restart) {
      await ctx.runMutation(internal.game.finishRestartGame, {
        gameId: game._id,
      });
    } else {
      await ctx.runMutation(internal.game.finishInitialSetup, {
        gameId: game._id,
        name,
      });
    }
  },
});

const generateNameForGame = async (theme: string) => {
  const resp = await getAnthropicResponse(
    'You are a helpful assistant. Respond with simple answers, and use only alphanumeric characters and spaces. Nothing else.',
    `You are an extremely excentric superintelligence who's well read and clever. 
     Don't be cringe. Generate a 4 word exciting name for our game based on the theme: "${theme}"`,
  );

  return resp || 'Kill The Robot';
};

export const getAnthropicResponse = async (system: string, user: string) => {
  const msg = await anthropic.messages.create({
    model: 'claude-3-5-sonnet-20240620',
    max_tokens: 5000,
    temperature: 0.5,
    system,
    messages: [{ role: 'user', content: user }],
  });

  if (msg.content[0].type === 'text') {
    return msg.content[0].text;
  }

  return '';
};

export const getOpenAIResponse = async (system: string, user: string) => {
  const completion = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      {
        role: 'system',
        content: system,
      },
      {
        role: 'user',
        content: user,
      },
    ],
  });

  return completion.choices[0].message.content;
};

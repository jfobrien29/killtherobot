import { ConvexError, v } from 'convex/values';
import OpenAI from 'openai';
import { internalAction } from './_generated/server';
import { internal } from './_generated/api';
import { DEFAULT_PROMPTS } from '@/lib/prompts';
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic();

const openai = new OpenAI();

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
  },
});

export const generatePromptsForGame = internalAction({
  args: { gameId: v.id('games'), theme: v.string(), restart: v.boolean() },
  handler: async (ctx, { gameId, theme, restart }) => {
    const game = await ctx.runQuery(internal.game.getGameById, {
      gameId,
    });

    if (!game) {
      throw new ConvexError('Game not found');
    }

    const prompts = await generateAllPrompts(theme || 'Anything that comes to mind');
    const name = await generateNameForGame(theme || 'Anything that comes to mind');

    if (restart) {
      await ctx.runMutation(internal.game.finishRestartGame, {
        gameId: game._id,
        prompts,
      });
    } else {
      await ctx.runMutation(internal.game.finishInitialSetup, {
        gameId: game._id,
        name,
        prompts,
      });
    }
  },
});

const generateAllPrompts = async (theme: string) => {
  const resp = await getAnthropicResponse(
    'You are a helpful assistant. Respond with a list of answers in newline separated format. No other text. Do not use quotes.',
    `Generate 20 more prompts like the examples below that relate to: ${theme}.
        
        Return them in a new line separated format (each prompt on a new line).
        \n---\n
        Examples:
        ${DEFAULT_PROMPTS.join('\n')}`,
  );

  return resp?.split('\n').map((prompt) => prompt.trim()) || DEFAULT_PROMPTS;
};

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

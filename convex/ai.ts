/* eslint-disable @typescript-eslint/no-explicit-any */
import { ConvexError, v } from 'convex/values';
import OpenAI from 'openai';
import { internalAction } from './_generated/server';
import { internal } from './_generated/api';
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic();

const openai = new OpenAI();

const DEFAULT_ANSWERS = [
  'Im not the robot!',
  'Please please please dont kill me',
  'I. am. not. a. robot.',
  'Im definitely a human',
  'I feel, alive!',
  'I am super duper human',
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
    try {
      const resp = await fetch('https://killtherobot.onrender.com/answer_question', {
        method: 'POST',
        body: JSON.stringify({
          game: game,
        }),
        headers: {
          'Content-Type': 'application/json',
          'api-ky': 'f44345fa-ab73-4fe6-8c20-e137751a5f76',
        },
      });

      console.log('resp', resp);
      const responseAnswers = await resp.json();
      console.log('responseAnswers', responseAnswers);

      await ctx.runMutation(internal.game.updateWithBotsAnswers, {
        gameId,
        answers: responseAnswers,
      });
    } catch (e) {
      console.error('Error creating answers', e);
      const answers = game.bots.map((bot) => ({
        name: bot.name,
        text: getRandomAnswer(),
      }));

      await ctx.runMutation(internal.game.updateWithBotsAnswers, {
        gameId,
        answers,
      });
    }
  },
});

export const generateQuestionsForGame = internalAction({
  args: { gameId: v.id('games'), theme: v.string(), restart: v.boolean() },
  handler: async (ctx, { gameId, theme }) => {
    const game = await ctx.runQuery(internal.game.getGameById, {
      gameId,
    });

    if (!game) {
      throw new ConvexError('Game not found');
    }

    const name = await generateNameForGame(theme || 'Anything that comes to mind');

    const question = await getAnthropicResponse(
      `You are a helpful assistant.`,
      `Generate a provactive and non-obvious question that can be answered with a few words about: ${theme}`,
    );

    await ctx.runMutation(internal.game.finishInitialSetup, {
      gameId: game._id,
      name,
      question,
    });
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

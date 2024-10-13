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

    const botsAlive = game.bots.filter((bot) => bot.isAlive);

    // TODO: This is where we would create answers for the bots
    // Send out response and expect an array of answer back
    try {
      const resp = await fetch('https://killtherobot.onrender.com/get_answer', {
        method: 'POST',
        body: JSON.stringify(game),
        headers: {
          'Content-Type': 'application/json',
          'api-key': 'f44345fa-ab73-4fe6-8c20-e137751a5f76',
        },
      });

      console.log('resp', resp);
      const responseAnswers = await resp.json();
      console.log('responseAnswers', responseAnswers);

      await ctx.runMutation(internal.game.updateWithBotsAnswers, {
        gameId,
        answers: responseAnswers
          .filter((answer: any) => botsAlive.some((bot: any) => bot.name === answer.name))
          .map((answer: any) => {
            return {
              name: answer.name,
              text: answer.text,
            };
          }),
      });
      // throw new Error('Not implemented');
    } catch (e) {
      console.error('Error creating answers', e);
      try {
        const aiAnswers = await Promise.all(
          [1, 2].map(() => {
            const randomNumberBetween1And5 = Math.floor(Math.random() * 5) + 1;
            const types = ['funny', 'clever', 'concise', 'cynical', 'bad at writing', 'lazy'];
            const myType = types[Math.floor(Math.random() * types.length)];
            return getAnthropicResponse(
              'You are a helpful assistant. Response with a one line answer. You are a human on a cellphone, so keep it short and concise. Do not use emojis, special characters, quotes, or punctuation. Only capitalize the first letter of the first word of your response.',
              `You  are a ${myType} and only respond with ${randomNumberBetween1And5} words. Write an answer to this question by filling in the blank: ${game.rounds[game.rounds.length - 1].question}`,
              0.6,
            );
          }),
        );

        await ctx.runMutation(internal.game.updateWithBotsAnswers, {
          gameId,
          answers: aiAnswers
            .map((answer, index) => ({
              name: game.bots[index].name,
              text: answer,
            }))
            .filter((answer) => {
              return botsAlive.some((bot: any) => bot.name === answer.name);
            }),
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
      `You are a helpful assistant. Response with a one line answer.`,
      `Please create and return one line exiting, action-packed question in the style of Cards Against Humanity where there is one blank to fill, using the template of hero_journey_stages below,  the theme=${theme} and the answer from last_voted_answer below. Never reference the current stage name in the question created. Do not return meta observations on what you do.
game_state:
  total_questions: 12
  theme: ${theme}
  hero_journey_stage: 8
hero_journey_stages:
  1. ordinary_world
  2. call_to_adventure
  3. refusal_of_the_call
  4. meeting_the_mentor
  5. crossing_the_threshold
  6. tests_allies_enemies
  7. approach_to_inmost_cave
  8. ordeal
  9. reward
  10. the_road_back
  11. resurrection
  12. return_with_elixir`,
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

export const generateNextQuestionForGame = internalAction({
  args: { gameId: v.id('games') },
  handler: async (ctx, { gameId }) => {
    const game = await ctx.runQuery(internal.game.getGameById, {
      gameId,
    });

    if (!game) {
      throw new ConvexError('Game not found');
    }

    const question = await getAnthropicResponse(
      `You are a helpful assistant. Response with a one line answer.`,
      `Please create and return one line exiting, action-packed question in the style of Cards Against Humanity where there is one blank to fill, using the template of hero_journey_stages below,  the theme=${game.theme} and the answer from last_voted_answer below. Never reference the current stage name in the question created. Do not return meta observations on what you do.
game_state:
  total_questions: 12
  theme: ${game.theme}
  hero_journey_stage: 8
  last_question: ${game.rounds[game.rounds.length - 1].question}
  last_voted_answer: ${game.rounds[game.rounds.length - 1].answers[0].text}
hero_journey_stages:
  1. ordinary_world
  2. call_to_adventure
  3. refusal_of_the_call
  4. meeting_the_mentor
  5. crossing_the_threshold
  6. tests_allies_enemies
  7. approach_to_inmost_cave
  8. ordeal
  9. reward
  10. the_road_back
  11. resurrection
  12. return_with_elixir`,
    );

    await ctx.runMutation(internal.game.finishNextRoundLoading, {
      gameId,
      question,
    });

    await ctx.scheduler.runAfter(0, internal.ai.botCreateAnswers, {
      gameId,
    });
  },
});

export const getAnthropicResponse = async (system: string, user: string, temperature = 0.5) => {
  const msg = await anthropic.messages.create({
    model: 'claude-3-5-sonnet-20240620',
    max_tokens: 5000,
    temperature: temperature,
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

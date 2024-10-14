/* eslint-disable @typescript-eslint/no-explicit-any */
import { ConvexError, v } from 'convex/values';
import OpenAI from 'openai';
import { internalAction } from './_generated/server';
import { internal } from './_generated/api';
import Anthropic from '@anthropic-ai/sdk';
import { getBotConfig } from './ai_prompts';

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

// Helper function to format the prompt
function formatPrompt(template: string, variables: Record<string, string>): string {
  return template.replace(/\{(\w+)\}/g, (_, key) => variables[key] || '');
}

// Function to get good QA pairs
function getGoodQAPairs(game: any): string {
  try {
    const liveHumans = game.humans
      .filter((human: any) => human.isAlive)
      .map((human: any) => human.name);

    const goodQAPairs = game.rounds.flatMap((r: any, i: number) => {
      const pairs = [`Question ${i}: ${r.question}`];
      r.answers.forEach((a: any, j: number) => {
        if (a.votes && a.votes.some((voter: string) => liveHumans.includes(voter))) {
          pairs.push(`- Answer ${j}: ${a.text}`);
        }
      });
      return pairs;
    });

    return goodQAPairs.join('\n\n');
  } catch (error) {
    console.error('Error getting good QA pairs:', error);
    return '';
  }
}

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

    try {
      const answers = await Promise.all(
        botsAlive.map(async (bot) => {
          const question = game.rounds[game.rounds.length - 1].question;
          const botConfig = getBotConfig(bot.name);

          if (!botConfig) {
            throw new Error(`No configuration found for bot ${bot.name}`);
          }

          const systemMessage = botConfig.system;
          const humanMessage = formatPrompt(botConfig.prompt, {
            question: question,
            good_qa_pairs: getGoodQAPairs(game),
          });

          const answerText = await getAnthropicResponse(systemMessage, humanMessage, 0.9);

          console.log('bot', bot.name);
          console.log('answerText', answerText);

          return {
            name: bot.name,
            text: answerText,
          };
        }),
      );

      await ctx.runMutation(internal.game.updateWithBotsAnswers, {
        gameId,
        answers,
      });
    } catch (e) {
      console.error('Error creating answers', e);
      // Fallback to random answers if there's an error
      const answers = botsAlive.map((bot) => ({
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
      `You are a helpful assistant. Response with a one line answer.`,
      `Please create and return one line exiting, action-packed question in the style of Cards Against Humanity where there is one blank to fill, using the template of hero_journey_stages below,  the theme=${theme} and the answer from last_voted_answer below. Never reference the current stage name in the question created. Do not return meta observations on what you do.
game_state:
  total_questions: 12
  theme: ${theme}
  hero_journey_stage: 0
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
  hero_journey_stage: ${game.rounds.length + 1}
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

export const getOpenAIResponse = async (system: string, user: string, temperature = 0.9) => {
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
    temperature,
  });

  return completion.choices[0].message.content;
};

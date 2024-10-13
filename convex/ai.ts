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
    } catch (e) {
      console.error('Error creating answers', e);
      try {
        const aiAnswers = await Promise.all(
          [1, 2, 3].map(() => {
            return getAnthropicResponse(
              'You are a helpful assistant. Response with a one line answer. You are a human on a cellphone, so keep it short and concise.',
              `You are lazy and only respond with 2-4 words. Write an answer to this question by filling in the blank: ${game.rounds[game.rounds.length - 1].question}`,
              0.8,
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
      `Please create a one line exciting, adventure question in the style of Cards Against Humanity where there is one blank to fill, using the template of hero_journey_stages below, the universe=${theme}, the current current_question=1.

game_state:
  current_question:
  total_questions: 12
  user_score: 0
  universe: 
  hero_journey_stage: "ordinary_world"
  last_voted_answer: ""
  user_response_style:
    average_length: 0
    tone: "neutral"
    complexity: "medium"

hero_journey_stages:
  - ordinary_world
  - call_to_adventure
  - refusal_of_the_call
  - meeting_the_mentor
  - crossing_the_threshold
  - tests_allies_enemies
  - approach_to_inmost_cave
  - ordeal
  - reward
  - the_road_back
  - resurrection
  - return_with_elixir

questions:
  # [Previous questions remain the same]

user_responses: []

ai_responses: []

process_input:
  - get_current_question
  - present_options
  - collect_user_votes
  - determine_winning_answer
  - analyze_user_responses
  - update_hero_journey_stage
  - generate_ai_response
  - update_game_state
  - check_game_end

generate_output:
  - format_ai_response_with_hero_journey
  - present_next_question
  - display_game_summary

update_hero_journey_stage:
  - determine_next_stage
  - apply_stage_to_response`,
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
      `Please create a one line exciting, adventure question in the style of Cards Against Humanity where there is one blank to fill, using the template of hero_journey_stages below, the universe=${game.theme}, the current current_question=${game.rounds.length + 1}.

game_state:
  current_question:
  total_questions: 12
  user_score: 0
  universe: 
  hero_journey_stage: "ordinary_world"
  last_voted_answer: ""
  user_response_style:
    average_length: 0
    tone: "neutral"
    complexity: "medium"

hero_journey_stages:
  - 1 ordinary_world
  - 2 call_to_adventure
  - 3 refusal_of_the_call
  - 4 meeting_the_mentor
  - 5 crossing_the_threshold
  - 6 tests_allies_enemies
  - 7 approach_to_inmost_cave
  - 8 ordeal
  - 9 reward
  - 10 the_road_back
  - 11 resurrection
  - 12 return_with_elixir

questions:
  ${game.rounds.map((round) => `- ${round.question}`).join('\n')}

process_input:
  - get_current_question
  - present_options
  - collect_user_votes
  - determine_winning_answer
  - analyze_user_responses
  - update_hero_journey_stage
  - generate_ai_response
  - update_game_state
  - check_game_end

generate_output:
  - format_ai_response_with_hero_journey
  - present_next_question
  - display_game_summary

update_hero_journey_stage:
  - determine_next_stage
  - apply_stage_to_response`,
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

export const getAnthropicResponse = async (
  system: string,
  user: string,
  temperature: number = 0.5,
) => {
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

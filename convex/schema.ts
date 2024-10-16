/* eslint-disable @typescript-eslint/no-explicit-any */
import { defineSchema, defineTable } from 'convex/server';
import { v } from 'convex/values';

export enum PlayerType {
  HUMAN = 'HUMAN',
  BOT = 'BOT',
}

export interface HumanOrBot {
  name: string;
  score: number;
  type?: PlayerType;
}

export interface Human extends HumanOrBot {
  isAdmin: boolean;
}

export interface Game {
  name: string;
  theme: string;
  code: string;
  stage: string; // PLAYERS_JOINING, ENTER_ANSWERS...
  humans: {
    name: string;
    isAlive: boolean; // Each round, someone is killed
    isAdmin: boolean; // First person to join who can "start" the game
    isCyborg: boolean; // If true, this human is a cyborg and can vote for answers
  }[];
  bots: {
    name: string;
    isAlive: boolean; // Each round, someone is killed
    config: string | null;
  }[];
  rounds: {
    question: string;
    answers: {
      name: string; // Who submitted the answer
      text: string; // The answer
      votes: string[]; // Array of names of who voted for this answer
      context: string | null; // New context for the answer given by the cyborg
    }[];
  }[]; // Questions and answers for each round
  currentRound: number; // start at 0, index for rounds array
}

export default defineSchema({
  games: defineTable({
    name: v.string(),
    theme: v.string(),
    code: v.string(),
    stage: v.string(),
    humans: v.array(
      v.object({
        name: v.string(),
        score: v.number(),
        isAdmin: v.boolean(),
        isAlive: v.boolean(),
        isCyborg: v.optional(v.boolean()),
      }),
    ),
    bots: v.array(
      v.object({
        name: v.string(),
        score: v.number(),
        isAlive: v.boolean(),
        config: v.optional(v.string()),
      }),
    ),
    rounds: v.array(
      v.object({
        question: v.string(),
        answers: v.array(
          v.object({
            name: v.string(),
            text: v.string(),
            votes: v.array(v.string()),
          }),
        ),
        context: v.optional(v.string()),
        eliminatedPlayer: v.string(),
      }),
    ),
    currentRound: v.number(),
    humanLives: v.optional(v.number()),
    botLives: v.optional(v.number()),
  }).index('by_code', ['code']),
});

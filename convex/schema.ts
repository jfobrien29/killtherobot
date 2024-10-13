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
      }),
    ),
    bots: v.array(
      v.object({
        name: v.string(),
        score: v.number(),
        isAlive: v.boolean(),
      }),
    ),
  }).index('by_code', ['code']),
});

/* prettier-ignore-start */

/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";
import type * as ai from "../ai.js";
import type * as ai_prompts from "../ai_prompts.js";
import type * as game from "../game.js";
import type * as prompts_generateAnswer from "../prompts/generateAnswer.js";
import type * as prompts_generateQuestion from "../prompts/generateQuestion.js";
import type * as prompts_generateRandomStyle from "../prompts/generateRandomStyle.js";
import type * as prompts_generateStyle from "../prompts/generateStyle.js";

/**
 * A utility for referencing Convex functions in your app's API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
declare const fullApi: ApiFromModules<{
  ai: typeof ai;
  ai_prompts: typeof ai_prompts;
  game: typeof game;
  "prompts/generateAnswer": typeof prompts_generateAnswer;
  "prompts/generateQuestion": typeof prompts_generateQuestion;
  "prompts/generateRandomStyle": typeof prompts_generateRandomStyle;
  "prompts/generateStyle": typeof prompts_generateStyle;
}>;
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

/* prettier-ignore-end */

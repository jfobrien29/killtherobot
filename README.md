# Kill The Robot

## Getting Started

First, install dependencies:

```bash
pnpm install
```

Then, run the development server:

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

Then, run the Convex dev server:

```bash
npx convex dev
```

If you've never run the Convex dev server before, you'll need to set up a convex account and sign in.
In order for it to run properly, you'll need to add an `OPENAI_API_KEY` and `ANTHROPIC_API_KEY` to your convex environment variables.
Each member of our team will run their own unique instance of the dev server, so you'll need to set up your own keys. Prod runs on Jack's account.

Now your app should be running!

## Data Schema

The `game` document is the most important

```typescript
export interface Game {
  name: string;
  theme: string;
  code: string;
  stage: string; // PLAYERS_JOINING, ENTER_ANSWERS...
  humans: {
    name: string;
    isAlive: boolean; // Each round, someone is killed
    isAdmin: boolean; // First person to join who can "start" the game
  }[];
  bots: {
    name: string;
    config: string?; // No longer used
    isAlive: boolean; // Each round, someone is killed
  }[];
  rounds: {
    question: string;
    answers: {
      name: string; // Who submitted the answer
      text: string; // The answer
      votes: string[]; // Array of names of who voted for this answer
    }[];
  }[]; // Questions and answers for each round
  currentRound: number; // start at 0, index for rounds array
}
```

## TODOs

To keep it dead simple, we're going to track out TODOs in the readme here

 [ ] Create a "GenerateStyle" prompt that takes in the users answers and thinks about each one of them
  [ ] Determine the text input style (caps, punctuation, length, special characters, emojis, etc)
  [ ] Determine the cleverness (puns, wordplay, thoughtfullness - likely extremely low)
  [ ] Determine the shared knowledge of the users (TV/movie references, world events, common schools/jobs)
  [ ] Humor style (deadpan, sarcasm, no humor, etc)
  [ ] Group context (who are in relationships, where did they recently come from, etc)
 [ ] Create a "GenerateAnswer" prompt that takes in the question and the context of the users and generates a response
 [ ] build a thorough test suite for all convex functions
  [ ] Move prompts to .txt files used in the webapp and testing suite
  [ ] Create test data for the the testing suite (for 10 scenarios, given this question and these human answers, generate bot responses)
  [ ] Manually configure the prompts and develope a rating system for responses
 [ ] include a "Cyborg" human player each round @Jack
  [ ] the "Cyborg" human player adds context for the bots each round
  [ ] each team (the robots and humans) get 3 lives. The game ends when lives go to zero.
 [ ] admin page/script to easily view past data
 [ ] Bots taunt players if they don't get picked
 [ ] Ability to cancel game mid round
 [ ] Play a sound when the game stage changes
 [ ] Game screen names larger
 [ ] Show more of the game state on device (for playing remotely, if we support that)
 [ ] Make the skip work more cleanly (refactor checkAllVotesIn and checkAllAnswersIn)
 [ ] On waiting screen, show the players who HAVEN'T answered yet (shame them!)
 [ ] More people = add more bots to the game
 [ ] Make the graphics way better. Consistent theme, nice transitions, better colors / topology


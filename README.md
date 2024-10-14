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

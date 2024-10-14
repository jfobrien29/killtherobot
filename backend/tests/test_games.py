game_1 = {
  "name": "Trivia Game",
  "theme": "General Knowledge",
  "code": "ABC123",
  "stage": "in-progress",
  "humans": [
    {
      "name": "John Doe",
      "isAlive": True,
      "isAdmin": True
    },
    {
      "name": "Jane Smith",
      "isAlive": False,
      "isAdmin": False
    }
  ],
  "bots": [
    {
      "name": "TriviaBot",
      "config": {
        "difficulty": "medium",
        "responseTime": "fast"
      },
      "isAlive": True
    }
  ],
  "rounds": [
    {
      "question": "What is the capital of France?",
      "answers": [
        {
          "name": "John Doe",
          "text": "Paris",
          "votes": ["Jane Smith"]
        },
        {
          "name": "TriviaBot",
          "text": "Berlin",
          "votes": ["John Doe"]
        }
      ]
    },
    {
      "question": "Who wrote '1984'?",
      "answers": [
        {
          "name": "Jane Smith",
          "text": "George Orwell",
          "votes": ["John Doe", "TriviaBot"]
        }
      ]
    }
  ],
  "currentRound": 2
}
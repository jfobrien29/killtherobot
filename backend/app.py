import os
from typing import Any

from dotenv import load_dotenv
from fastapi import FastAPI, Header, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

_ = load_dotenv()

BACKEND_API_KEY = os.getenv("BACKEND_API_KEY")

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods
    allow_headers=["*"],  # Allows all headers
)


@app.get("/healthz")
async def healthz():
    return {"status": "healthy"}


class Human(BaseModel):
    name: str
    isAlive: bool
    isAdmin: bool


class Bot(BaseModel):
    name: str
    config: Any
    isAlive: bool


class Answer(BaseModel):
    name: str
    text: str
    votes: list[str] | None


class Round(BaseModel):
    question: str
    answers: list[Answer]


class Game(BaseModel):
    name: str
    theme: str
    code: str
    stage: str
    humans: list[Human]
    bots: list[Bot]
    rounds: list[Round]
    currentRound: int


@app.post("/get_answer")
async def answer_question(game: Game, api_key: str = Header(...)) -> list[Answer]:
    """Generate an answer for the current round's question using OpenAI API.

    Args:
        game (Game): The current game state, including the question to be answered.
        api_key (str): The API key for authentication, passed as a header.

    Returns:
        dict: A dictionary containing the generated answer.

    Raises:
        HTTPException: If the API key is invalid (401 Unauthorized).
    """
    if api_key != os.getenv("OPENAI_API_KEY"):
        raise HTTPException(status_code=401, detail="Invalid API key")

    question = game.rounds[-1].question

    # TODO: Implement the logic to answer the question using OpenAI API
    # This is a placeholder response
    return [Answer(name="bot1", text=f"answer to {question}", votes=None)]

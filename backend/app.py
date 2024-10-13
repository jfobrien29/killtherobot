import os

from dotenv import load_dotenv
from fastapi import FastAPI, Header, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from killtherobot_backend.llms import get_answers
from killtherobot_backend.models import Answer, Game

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
    names = [bot.name for bot in game.bots]

    answers = get_answers(question, names)

    return answers

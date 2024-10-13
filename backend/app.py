import logging
import os

from dotenv import load_dotenv
from fastapi import FastAPI, Header, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from killtherobot_backend.llms import answer_question
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
async def get_answer(game: Game, api_key: str = Header(...)) -> list[Answer]:
    """Generate an answer for the current round's question using OpenAI API.

    Args:
        game (Game): The current game state, including the question to be answered.
        api_key (str): The API key for authentication, passed as a header.

    Returns:
        dict: A dictionary containing the generated answer.

    Raises:
        HTTPException: If the API key is invalid (401 Unauthorized).
    """
    print("api_key = ", api_key)
    print("BACKEND_API_KEY = ", BACKEND_API_KEY)
    if api_key != BACKEND_API_KEY:
        print("validation failure")
        # raise HTTPException(status_code=401, detail="Invalid API key")
    else:
        print("validation success")

    answers = answer_question(game)

    # question = game.rounds[-1].question
    # names = [bot.name for bot in game.bots]

    # answers = [
    #     Answer(name=name, text=f"answer to {question}", votes=None) for name in names
    # ]

    return answers


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    raw_body = await request.body()
    logging.error(f"Invalid request body: {raw_body.decode('utf-8')}")

    return JSONResponse(
        status_code=400,
        content={"detail": exc.errors(), "body": raw_body.decode("utf-8")},
    )
    )

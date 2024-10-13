from typing import Any

from pydantic import BaseModel


class Human(BaseModel):
    name: str
    isAlive: bool
    isAdmin: bool


class Bot(BaseModel):
    name: str
    config: Any | None
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

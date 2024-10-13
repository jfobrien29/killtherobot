# export interface Game {
#   name: string;
#   theme: string;
#   code: string;
#   stage: string; // PLAYERS_JOINING, ENTER_ANSWERS...
#   humans: {
#     name: string;
#     isAlive: boolean; // Each round, someone is killed
#     isAdmin: boolean; // First person to join who can "start" the game
#   }[];
#   bots: {
#     name: string;
#     config: any;
#     isAlive: boolean; // Each round, someone is killed
#   }[];
#   rounds: {
#     question: string;
#     answers: {
#       name: string; // Who submitted the answer
#       text: string; // The answer
#       votes: string[]; // Array of names of who voted for this answer
#     }[];
#   }[]; // Questions and answers for each round
#   currentRound: number; // start at 0, index for rounds array
# }

from dataclasses import dataclass
import json
from typing import Any, List

@dataclass
class Human:
    name: str
    isAlive: bool
    isAdmin: bool

@dataclass
class Bot:
    name: str
    config: Any
    isAlive: bool

@dataclass
class Answer:
    name: str
    text: str
    votes: List[str]

@dataclass
class Round:
    question: str
    answers: List[Answer]

@dataclass
class Game:
    name: str
    theme: str
    code: str
    stage: str
    humans: List[Human]
    bots: List[Bot]
    rounds: List[Round]
    currentRound: int

def json_to_dataclass(json_string: str) -> Game:
    """
    Converts a JSON string to a Game dataclass object.

    Args:
        json_string (str): JSON string to convert.

    Returns:
        Game: Game dataclass object.
    """
    data = json.loads(json_string)
    data['humans'] = [Human(**human) for human in data['humans']]
    data['bots'] = [Bot(**bot) for bot in data['bots']]
    data['rounds'] = [Round(question=round['question'], answers=[Answer(**answer) for answer in round['answers']]) for round in data['rounds']]
    return Game(**data)



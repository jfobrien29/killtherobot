from typing import Generator
from utils import Game, Human, Answer, Round
from collections import defaultdict

from openai import OpenAI

from .models import Answer, Game


def answer_question(
    question: str,
    key: str,
    personality: str = "funny",
    temperature: float = 0.7,
    max_tokens: int = 150,
    top_p: float = 1.0,
    frequency_penalty: float = 0.0,
    presence_penalty: float = 0.0,
) -> Generator[str, None, None]:
    client = OpenAI(api_key=key)

<<<<<<< HEAD
    personality_template = {'hilarious': 'hilarious comedian and helpful assistant',
                            'cynical': 'cynical comedian and helpful assistant',
                            'funny': 'funny guy with the humor of a 15 year old boy and helpful assistant'}

    
    stream = client.chat.completions.create(
        model="gpt-4-0125-preview",
        messages=[
            {"role": "system", "content": f"You are a {personality_template[personality]}.  Listen to my instructions and respond. Think out of the box and be funny. Write like a human would using their phone keyboard. Do not use special characters, emojis, quotes, or punctuation. Only capitalize the first letter of your response.."},
            {"role": "user", "content": question}
=======
    stream = client.chat.completions.create(
        model="gpt-4-0125-preview",
        messages=[
            {
                "role": "system",
                "content": f"You are a {personality}. Respond to the user's questions accordingly.",
            },
            {"role": "user", "content": question},
>>>>>>> 232dc4e4d041ef12d6837e4d2dda515296225a1f
        ],
        temperature=temperature,
        max_tokens=max_tokens,
        top_p=top_p,
        frequency_penalty=frequency_penalty,
        presence_penalty=presence_penalty,
        stream=True,
    )
<<<<<<< HEAD
    
    content = ""
    for chunk in stream:
        if chunk.choices[0].delta.content is not None:
            content += chunk.choices[0].delta.content

    return Answer(name="AI", text=content, votes=[])
=======

    for chunk in stream:
        if chunk.choices[0].delta.content is not None:
            yield chunk.choices[0].delta.content


def get_answers(game: Game) -> list[Answer]:
    question = game.rounds[-1].question
    names = [bot.name for bot in game.bots]

    live_humans = [human.name for human in game.humans if human.isAlive]

    good_qa_pairs = []
    for i, r in enumerate(game.rounds):
        good_qa_pairs.append(f"Question {i}: {r.question}")
        for j, a in enumerate(r.answers):
            if a.votes is not None and any(human in a.votes for human in live_humans):
                good_qa_pairs.append(f"- Answer {j}: {a.text}")

    good_qa_pairs_str = "\n\n".join(good_qa_pairs)

    return [
        Answer(name=name, text=f"answer to {question}", votes=None) for name in names
    ]
>>>>>>> 232dc4e4d041ef12d6837e4d2dda515296225a1f

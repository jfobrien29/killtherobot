from typing import Generator

from openai import OpenAI

from .models import Answer, Game


def answer_question(
    question: str,
    key: str,
    personality: str = "helpful assistant",
    temperature: float = 0.7,
    max_tokens: int = 150,
    top_p: float = 1.0,
    frequency_penalty: float = 0.0,
    presence_penalty: float = 0.0,
) -> Generator[str, None, None]:
    client = OpenAI(api_key=key)

    stream = client.chat.completions.create(
        model="gpt-4-0125-preview",
        messages=[
            {
                "role": "system",
                "content": f"You are a {personality}. Respond to the user's questions accordingly.",
            },
            {"role": "user", "content": question},
        ],
        temperature=temperature,
        max_tokens=max_tokens,
        top_p=top_p,
        frequency_penalty=frequency_penalty,
        presence_penalty=presence_penalty,
        stream=True,
    )

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

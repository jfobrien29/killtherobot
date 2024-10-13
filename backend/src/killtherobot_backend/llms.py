from typing import Generator

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

    personality_template = {
        "hilarious": "hilarious comedian and helpful assistant",
        "cynical": "cynical comedian and helpful assistant",
        "funny": "funny guy with the humor of a 15 year old boy and helpful assistant",
    }

    stream = client.chat.completions.create(
        model="gpt-4-0125-preview",
        messages=[
            {
                "role": "system",
                "content": f"You are a {personality_template[personality]}.  Listen to my instructions and respond. Think out of the box and be funny. Write like a human would using their phone keyboard. Do not use special characters, emojis, quotes, or punctuation. Only capitalize the first letter of your response..",
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

    content = ""
    for chunk in stream:
        if chunk.choices[0].delta.content is not None:
            content += chunk.choices[0].delta.content

    return Answer(name="AI", text=content, votes=[])


def get_answers(game: Game) -> str:
    question = game.rounds[-1].question
    names = [bot.name for bot in game.bots]

    live_humans = [human.name for human in game.humans if human.isAlive]

    good_qa_pairs = []
    for i, r in enumerate(game.rounds):
        good_qa_pairs.append(f"Question {i}: {r.question}")
        for j, a in enumerate(r.answers):
            answers = []
            if any(human in a.votes for human in live_humans):
                answers.append(f"- Answer {j}: {a.text}")
            good_qa_pairs.append("\n".join(answers))

    good_qa_pairs_str = "\n\n".join(good_qa_pairs)

    return good_qa_pairs_str

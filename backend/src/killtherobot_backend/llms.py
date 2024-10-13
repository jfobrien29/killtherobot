from typing import Generator

from .models import Answer
from openai import OpenAI


def answer_question(
    question: str,
    key: str,
    personality: str = "helpful assistant",
    temperature: float = 0.7,
    max_tokens: int = 150,
    top_p: float = 1.0,
    frequency_penalty: float = 0.0,
    presence_penalty: float = 0.0
) -> Generator[str, None, None]:
    
    client = OpenAI(api_key=key)
    
    stream = client.chat.completions.create(
        model="gpt-4-0125-preview",
        messages=[
            {"role": "system", "content": f"You are a {personality}. Respond to the user's questions accordingly."},
            {"role": "user", "content": question}
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


def get_answers(question, names) -> list[Answer]:
    pass    pass
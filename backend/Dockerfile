FROM python:3.12-slim

RUN pip install pdm
RUN pdm install --no-lock --no-editable

WORKDIR /app
COPY . /app

EXPOSE 8000

CMD ["pdm", "run", "uvicorn", "app:app", "--host", "0.0.0.0", "--port", "8000"]

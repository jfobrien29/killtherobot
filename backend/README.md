# killtherobot_backend

## Run Local Server

Install pdm if needed:

```bash
curl -sSL https://pdm-project.org/install-pdm.py | python3 -
```

Install dependencies

```bash
pdm install
```

Launch local server:

```bash
uvicorn app:app --reload
```

## Run Docker Container

Build the Docker image:

```bash
docker build -t killtherobot_backend:latest .
```

Run the image:

```bash
docker run -d -p 8000:8000 killtherobot_backend:latest
```

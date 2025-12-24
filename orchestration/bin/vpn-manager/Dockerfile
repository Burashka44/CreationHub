FROM python:3.9-slim

WORKDIR /app

RUN pip install flask requests

# Install docker-cli to control sibling container
RUN apt-get update && apt-get install -y docker.io curl && rm -rf /var/lib/apt/lists/*

COPY . .

CMD ["python", "app.py"]

FROM python:3.9-slim-buster
ENV PYTHONUNBUFFERED=1

WORKDIR /app

COPY apps/trainer/.env .
COPY apps/trainer/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY apps/trainer/main.py .

CMD ["python", "main.py"]

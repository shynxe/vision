FROM python:3.9-slim-buster
ENV PYTHONUNBUFFERED=1

EXPOSE 15671 15672

WORKDIR /app
RUN apt-get update && apt-get install ffmpeg libsm6 libxext6  -y

COPY apps/trainer/.env .
COPY apps/trainer/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY apps/trainer/app .


CMD ["python", "main.py"]

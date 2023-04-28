import os
import pika
from dotenv import load_dotenv

from train import handle_train

print(' [*] Waiting for messages. To exit press CTRL+C')
load_dotenv()

# Read the RabbitMQ URI from the environment variable
rabbitmq_uri = os.environ['RABBIT_MQ_URI']

# Read the trainer queue name from the environment variable
trainer_queue = os.environ['RABBIT_MQ_TRAINER_QUEUE']

# Create a connection to the RabbitMQ instance
connection = pika.BlockingConnection(pika.URLParameters(rabbitmq_uri))

# Create a channel on the connection
channel = connection.channel()

# Declare the trainer queue
channel.queue_declare(queue=trainer_queue, durable=True)


# Start consuming messages from the trainer queue
channel.basic_consume(queue=trainer_queue, on_message_callback=handle_train, auto_ack=False)

try:
    channel.start_consuming()
except KeyboardInterrupt:
    channel.stop_consuming()

connection.close()
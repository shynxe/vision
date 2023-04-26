import os
import pika
from dotenv import load_dotenv

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

# Define a function to handle incoming messages
def callback(ch, method, properties, body):
    # Do something with the message body
    print(body)

    # Acknowledge the message
    ch.basic_ack(delivery_tag=method.delivery_tag)

# Start consuming messages from the trainer queue
channel.basic_consume(queue=trainer_queue, on_message_callback=callback, auto_ack=False)

try:
    channel.start_consuming()
except KeyboardInterrupt:
    channel.stop_consuming()

connection.close()

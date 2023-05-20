import os
import pika
from dotenv import load_dotenv

from train import handle_train
from prepare import prepare_machine

load_dotenv()

# Prepare machine for training
print(" [*] Preparing machine for training")
prepare_machine()

# Read the RabbitMQ URI from the environment variable
rabbitmq_uri = os.environ['RABBIT_MQ_URI']

# Read the trainer queue name from the environment variable
# Read the datasets queue name from the environment variable
trainer_queue = os.environ['RABBIT_MQ_TRAINER_QUEUE']
datasets_queue = os.environ['RABBIT_MQ_DATASETS_QUEUE']

# Create a connection to the RabbitMQ instance
connection = pika.BlockingConnection(pika.URLParameters(rabbitmq_uri))

# Create a channel on the connection
channel = connection.channel()

# Declare the trainer queue
channel.queue_declare(queue=trainer_queue, durable=True)

# Declare the datasets queue
channel.queue_declare(queue=datasets_queue, durable=True)

# Start consuming messages from the trainer queue
channel.basic_consume(queue=trainer_queue, on_message_callback=handle_train, auto_ack=False)

print(' [*] Waiting for messages. To exit press CTRL+C')
try:
    channel.start_consuming()
except KeyboardInterrupt:
    channel.stop_consuming()

connection.close()

import json
import os
from dotenv import load_dotenv
import traceback

import requests

load_dotenv()
filestorage_image_url = os.environ['FILESTORAGE_IMAGE_URL']


def handle_train(ch, method, properties, body):
    message = body.decode()
    payload = json.loads(message)

    data = payload['data']
    print(" [*] Received message: {}".format(data))

    authentication = data['Authentication']
    cookies = {'Authentication': authentication}

    try:
        images, labels, model_name = parse_input(data)
    except Exception as e:
        print(" [x] Error in parsing input: {}".format(e))
        print(traceback.format_exc())
        ch.basic_ack(delivery_tag=method.delivery_tag)
        return

    try:
        download_images(images, cookies)
    except Exception as e:
        print(" [x] Error in downloading images: {}".format(e))
        print(traceback.format_exc())
        ch.basic_ack(delivery_tag=method.delivery_tag)
        return

    ch.basic_ack(delivery_tag=method.delivery_tag)


# Send a GET request to each of the images in the message
# and save the image to disk
def download_images(images, cookies):
    for image_name in images:
        print(" [*] Image name: {}".format(image_name))
        image_response = requests.get(filestorage_image_url + image_name, cookies=cookies)
        with open(image_name, 'wb') as f:
            print(" [*] Writing image to disk")
            f.write(image_response.content)
            print(" [*] Image written to disk")


# Parse data from the message
# Return a list of images and a list of labels
def parse_input(data):
    images = []
    labels = set()
    model_name = data['modelName']

    if model_name is None:
        raise Exception("No model name in message")

    if data['images'] is None:
        raise Exception("No images in message")

    for image in data['images']:
        if image['name'] is None:
            raise Exception("No filename in image")

        images.append(image['name'])
        for bounding_box in image['boundingBoxes']:
            labels.add(bounding_box['label'])

    return images, list(labels), model_name

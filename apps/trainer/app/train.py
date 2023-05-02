import json
import os

import pika
from dotenv import load_dotenv
import traceback
from ultralytics import YOLO

import requests

from prepare import prepare_dataset, get_yaml_path

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
        images, labels, model_name, dataset_id = parse_input(data)
    except Exception as e:
        print(" [x] Error in parsing input: {}".format(e))
        print(traceback.format_exc())
        respond_error(ch, properties, 'Error in parsing input')
        ch.basic_ack(delivery_tag=method.delivery_tag)
        return

    try:
        dataset_path = prepare_dataset(dataset_id)
    except Exception as e:
        print(" [x] Error in preparing dataset: {}".format(e))
        print(traceback.format_exc())
        respond_error(ch, properties, 'Error in preparing dataset')
        ch.basic_ack(delivery_tag=method.delivery_tag)
        return

    try:
        download_dataset(dataset_path, images, cookies)
    except Exception as e:
        print(" [x] Error in downloading images: {}".format(e))
        print(traceback.format_exc())
        respond_error(ch, properties, 'Error in downloading images')
        ch.basic_ack(delivery_tag=method.delivery_tag)
        return

    respond_success(ch, properties, 'Successfully started training')
    ch.basic_ack(delivery_tag=method.delivery_tag)

    yaml_path = get_yaml_path(dataset_id)
    print(" [*] .yaml file created: {}".format(yaml_path))

    # Train the model
    try:
        train_model(yaml_path)
        print(" [*] Job done.")
    except Exception as e:
        print(" [x] Error in training model: {}".format(e))
        print(traceback.format_exc())
        return


def train_model(yaml_path):
    # Train the model
    print(" [*] Training model with .yaml file: {}".format(yaml_path))
    model = YOLO('yolov8n.yaml')
    model.train(data='./' + yaml_path, epochs=10)


def respond_error(ch, properties, message):
    response = {
        'status': 'error',
        'message': message
    }
    reply_to_message(ch, properties, response)


def respond_success(ch, properties, message):
    response = {
        'status': 'success',
        'message': message
    }
    reply_to_message(ch, properties, response)


def reply_to_message(ch, properties, response):
    ch.basic_publish(exchange='',
                     routing_key=properties.reply_to,
                     properties=pika.BasicProperties(correlation_id=properties.correlation_id),
                     body=json.dumps(response))


# Send a GET request to each of the images in the message
# and save the image to disk
def download_dataset(dataset_path, images, cookies):
    # split images into train, test, valid
    # then download them and save them to disk in the correct folder
    # train: 80%
    # test: 10%
    # valid: 10%

    # all folders are already created
    # images/train
    # images/test
    # images/valid
    image_filenames = list(images.keys())
    dataset_id = dataset_path.split('/')[-1]

    train_end_index = int(len(image_filenames) * 0.8)
    test_end_index = int(len(image_filenames) * 0.9)
    train = image_filenames[:train_end_index]
    test = image_filenames[train_end_index:test_end_index]
    valid = image_filenames[test_end_index:]

    stages = ["train", "test", "valid"]
    images_split = [train, test, valid]

    # check if any of the stages are empty
    for i in range(len(stages)):
        stage = stages[i]
        stage_images = images_split[i]
        if len(stage_images) == 0:
            raise Exception("Not enough images for stage {}".format(stage))

    print(" [*] Downloading images")
    for i in range(len(stages)):
        stage = stages[i]
        stage_images = images_split[i]
        for image_name in stage_images:
            # for each image, create a .txt file with the labels
            # the .txt file should be in the labels folder, with the same name as the image
            # e.g. images/train/1.jpg -> labels/train/1.txt
            image_response = requests.get(filestorage_image_url + dataset_id + "/" + image_name, cookies=cookies)
            with open(dataset_path + "/images/" + stage + "/" + image_name, 'wb') as f:
                f.write(image_response.content)

            image_name_no_ext = os.path.splitext(image_name)[0]
            with open(dataset_path + "/labels/" + stage + "/" + image_name_no_ext + ".txt", 'w') as f:
                for label in images[image_name]:
                    f.write(label + "\n")

    print(" [*] Downloaded {} images".format(len(images)))


# Parse data from the message
# Return a list of images and a list of labels
def parse_input(data):
    images = {}
    labels = {}
    label_count = 0
    model_name = data['modelName']
    dataset_id = data['datasetId']

    if model_name is None:
        raise Exception("No model name in message")

    if data['images'] is None:
        raise Exception("No images in message")

    for image in data['images']:
        if image['name'] is None:
            raise Exception("No filename in image")

        filename = image['name']
        bounding_boxes = []
        for bounding_box in image['boundingBoxes']:
            label = bounding_box['label']
            x, y, w, h = bounding_box['x'], bounding_box['y'], bounding_box['width'], bounding_box['height']
            if label not in labels:
                labels[label] = label_count
                label_count += 1
            bounding_boxes.append(f"{labels[label]} {x} {y} {w} {h}")

        images[filename] = bounding_boxes

    return images, labels, model_name, dataset_id

import json
import os
from dotenv import load_dotenv

import pika
import traceback
from ultralytics import YOLO

import requests
import shutil

from prepare import prepare_dataset, get_yaml_path, get_model_exports_paths
from links import get_image_download_url, get_model_upload_url
from constants import ModelStatus

load_dotenv()
datasets_queue = os.environ['RABBIT_MQ_DATASETS_QUEUE']
model_trained_pattern = 'model_trained'


def handle_train(ch, method, _, body):
    message = body.decode()
    decoded_body = json.loads(message)
    data = decoded_body['data']
    print(" [*] Received message: {}".format(data))

    success, payload = _train(data)

    if success:
        respond_success(ch, payload, data)
        ch.basic_ack(delivery_tag=method.delivery_tag)
    else:
        respond_error(ch, payload, data)
        ch.basic_ack(delivery_tag=method.delivery_tag)

    try:
        _clean_up()
        print(" [*] Clean up done.")
    except Exception as e:
        print(" [x] Error in cleaning up: {}".format(e))
        print(traceback.format_exc())
        return


def _train(data):
    authentication = data['Authentication']
    cookies = {'Authentication': authentication}

    try:
        images, labels = _get_dataset(data)
        model_name = _get_model_name(data)
        dataset_id = _get_dataset_id(data)
        hyper_parameters = _get_hyper_parameters(data)

    except Exception as e:
        print(" [x] Error in parsing input: {}".format(e))
        print(traceback.format_exc())
        return False, 'Error in parsing input'

    try:
        dataset_path = prepare_dataset(dataset_id, labels)
    except Exception as e:
        print(" [x] Error in preparing dataset: {}".format(e))
        print(traceback.format_exc())
        return False, 'Error in preparing dataset'

    try:
        _download_dataset(dataset_path, images, cookies)
    except Exception as e:
        print(" [x] Error in downloading images: {}".format(e))
        print(traceback.format_exc())
        return False, 'Error in downloading images'

    yaml_path = get_yaml_path(dataset_id)
    print(" [*] .yaml file created: {}".format(yaml_path))

    # Train the model
    try:
        model = _train_model(yaml_path, hyper_parameters)
        print(" [*] Training done.")
        model.export(format='torchscript')
        model.export(format='onnx')
        model.export(format='tflite')
        print(" [*] Model exported.")
    except Exception as e:
        print(" [x] Error in training model: {}".format(e))
        print(traceback.format_exc())
        return False, 'Error in training model'

    # Upload the model
    try:
        uploaded_models = _upload_results(dataset_id, model_name, cookies)
        print(" [*] Model uploaded.")
    except Exception as e:
        print(" [x] Error in uploading model: {}".format(e))
        print(traceback.format_exc())
        return False, 'Error in uploading model'

    return True, uploaded_models


def _train_model(yaml_path, hyper_parameters):
    # Train the model
    print(" [*] Training model with .yaml file: {}".format(yaml_path))
    model = YOLO('yolov8n.pt')
    model.train(data='./' + yaml_path, **hyper_parameters)
    return model


def respond_error(ch, message, data):
    response = {
        'status': ModelStatus['FAILED'],
        'message': message
    }
    print(' [x] Error: {}'.format(message))
    publish_model_trained(ch, response, data)


def respond_success(ch, uploaded_models, data):
    response = {
        'status': ModelStatus['UPLOADED'],
        'message': "Model uploaded successfully",
        'modelFiles': uploaded_models
    }
    # add the uploaded models to the response
    print(' [*] Success: {}'.format(response))
    publish_model_trained(ch, response, data)


def publish_model_trained(ch, payload, data):
    print(' [*] Publishing data: {}'.format(payload))
    model_name = _get_model_name(data)
    dataset_id = _get_dataset_id(data)
    auth = data['Authentication']
    payload['modelName'] = model_name
    payload['datasetId'] = dataset_id
    payload['Authentication'] = auth

    body = {
        'data': payload,
        'pattern': model_trained_pattern,
    }
    ch.basic_publish(
        exchange='',
        routing_key=datasets_queue,
        body=json.dumps(body),
        properties=pika.BasicProperties(
            delivery_mode=2  # Make the message persistent
        )
    )


# Send a GET request to each of the images in the message
# and save the image to disk
def _download_dataset(dataset_path, images, cookies):
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
            _image_download_url = get_image_download_url(dataset_id, image_name)
            image_response = requests.get(_image_download_url, cookies=cookies)
            with open(dataset_path + "/images/" + stage + "/" + image_name, 'wb') as f:
                f.write(image_response.content)

            image_name_no_ext = os.path.splitext(image_name)[0]
            with open(dataset_path + "/labels/" + stage + "/" + image_name_no_ext + ".txt", 'w') as f:
                for label in images[image_name]:
                    f.write(label + "\n")

    print(" [*] Downloaded {} images".format(len(images)))
    print(" [*] Wrote labels to disk")


def _upload_results(dataset_id, model_name, cookies):
    _model_upload_url = get_model_upload_url(dataset_id)
    model_exports_paths = get_model_exports_paths()

    uploaded_models = []

    for model_type, export_path in model_exports_paths.items():
        model_filename = model_name + os.path.splitext(export_path)[1]  # Get extension from the export path

        files = {
            "model": (model_filename, open(export_path, "rb"))
        }

        upload_response = requests.post(_model_upload_url, files=files, cookies=cookies)
        if upload_response.status_code != 201:
            print(" [*] Error uploading: {}".format(upload_response.text))
            raise Exception(f"Error uploading {model_type} model to trainer")

        # {
        #     "originalName": "_111510370_060683565.txt",
        #     "fileName": "5e31c447cd81769ce1b5585ab3a2d2a0",
        #     "destination": "/tmp/uploads/6435ade2f7613b0080f7984d/models",
        #     "fileUrl": "http://localhost:3002/model/6435ade2f7613b0080f7984d/5e31c447cd81769ce1b5585ab3a2d2a0"
        # }

        response = upload_response.json()
        uploaded_models.append({
            "url": response["fileUrl"],
            "modelType": model_type
        })
        print(f" [*] Uploaded {model_type} model to trainer")
    return uploaded_models


# Parse data from the message
# Return a list of images and a list of labels
def _get_dataset(data):
    images = {}
    labels = {}
    label_count = 0

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
            center_x = x + w / 2
            center_y = y + h / 2
            if label not in labels:
                labels[label] = label_count
                label_count += 1
            bounding_boxes.append(f"{labels[label]} {center_x} {center_y} {w} {h}")

        images[filename] = bounding_boxes

    return images, labels


def _get_model_name(data):
    if data['modelName'] is None:
        raise Exception("No modelName in message")
    return data['modelName']


def _get_dataset_id(data):
    if data['datasetId'] is None:
        raise Exception("No datasetId in message")
    return data['datasetId']


def _get_hyper_parameters(data):
    hyper_params = {}
    if data['hyperParameters'] is None:
        return hyper_params

    return data['hyperParameters']


def _clean_up():
    # clean up runs folder
    shutil.rmtree('runs')

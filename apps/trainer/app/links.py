from dotenv import load_dotenv
import os

load_dotenv()
filestorage_url = os.environ['FILESTORAGE_URL']


def get_image_download_url(dataset_id, image_name):
    return filestorage_url + "/image/" + dataset_id + "/" + image_name


def get_model_upload_url(dataset_id):
    return filestorage_url + "/upload/model/" + dataset_id
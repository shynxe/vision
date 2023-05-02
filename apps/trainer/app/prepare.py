import os
import traceback

datasets_folder_name = "datasets"
trainings_folder_name = "trainings"


def prepare_machine():
    datasets_path = os.path.join(trainings_folder_name, datasets_folder_name)
    create_folder_if_not_exists(datasets_path)


def create_folder_if_not_exists(path):
    if not os.path.exists(path):
        os.makedirs(path)
        print(f"Folder '{path}' does not exist. Creating it...")


def empty_folder_contents(path):
    if os.path.exists(path):
        for file in os.listdir(path):
            file_path = os.path.join(path, file)
            try:
                if os.path.isfile(file_path):
                    os.unlink(file_path)
            except Exception as e:
                print(e)


def prepare_dataset(dataset_name):
    print(" [*] Preparing dataset folder structure")
    dataset_path = get_dataset_path(dataset_name)
    training_path = os.path.join(trainings_folder_name, dataset_name)
    images_path = os.path.join(dataset_path, "images")
    labels_path = os.path.join(dataset_path, "labels")
    stages = ["test", "train", "valid"]
    folders = [dataset_path, images_path, labels_path, training_path]
    for stage in stages:
        folders.append(os.path.join(images_path, stage))
        folders.append(os.path.join(labels_path, stage))

    # Create all folders, and empty their contents if they already exist
    print(" [*] Creating folders for dataset: {}".format(dataset_name))
    try:
        for path in folders:
            create_folder_if_not_exists(path)
            empty_folder_contents(path)
    except Exception as e:
        print(" [x] Error in creating folders: {}".format(e))
        print(traceback.format_exc())
        return
    print(" [*] Folder structure created")
    print_tree(folders)

    # Create .yaml file for YOLO training
    print(" [*] Creating .yaml file for YOLO training")
    yaml_path = get_yaml_path(dataset_name)

    try:
        create_yaml(yaml_path)
    except Exception as e:
        print(" [x] Error in creating .yaml file: {}".format(e))
        print(traceback.format_exc())
        return

    return dataset_path


def get_yaml_location(dataset_id):
    return os.path.join(trainings_folder_name, dataset_id)


def get_yaml_path(dataset_id):
    return get_yaml_location(dataset_id) + "/" + dataset_id + ".yaml"


def get_dataset_path(dataset_id):
    return os.path.join(datasets_folder_name, dataset_id)


def create_yaml(yaml_path):
    yaml_filename = os.path.basename(yaml_path)
    yaml_filename_no_ext = os.path.splitext(yaml_filename)[0]

    with open(yaml_path, "w") as yaml_file:
        yaml_file.write("path: {}\n".format(yaml_filename_no_ext))
        yaml_file.write("train: images/train\n")
        yaml_file.write("val: images/valid\n")
        yaml_file.write("test: images/test\n")
        yaml_file.write("\n")
        yaml_file.write("names:\n")
        yaml_file.write("  0: no_mask\n")
        yaml_file.write("  1: mask\n")


def print_tree(folders):
    """
    Print the folder structure as a tree, given a list of folder paths
    """
    tree = {}
    for path in folders:
        parts = path.split(os.sep)
        node = tree
        for part in parts:
            if part not in node:
                node[part] = {}
            node = node[part]

    def print_node(node, prefix=""):
        for name, child_node in node.items():
            print("{}{}".format(prefix, name))
            if child_node:
                print_node(child_node, prefix=prefix + "│   ")

    print_node(tree, prefix="├── ")

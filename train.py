import argparse
import tensorflow as tf
import config
from load.load_dataset import load_datasets
from model.build_model import build_model
from model.train_model import train_model

def set_gpu_config(use_gpu):
    if use_gpu:
        gpus = tf.config.experimental.list_physical_devices('GPU')
        if gpus:
            try:
                for gpu in gpus:
                    tf.config.experimental.set_memory_growth(gpu, True)
                logical_gpus = tf.config.experimental.list_logical_devices('GPU')
                print(f"{len(gpus)} Physical GPUs, {len(logical_gpus)} Logical GPUs")
            except RuntimeError as e:
                print(e)
    else:
        try:
            tf.config.set_visible_devices([], 'GPU')
            logical_gpus = tf.config.experimental.list_logical_devices('CPU')
            print("Using CPU only.")
        except RuntimeError as e:
            print(e)

def main():
    train_ds, val_ds, class_names = load_datasets(config.img_height, config.img_width)
    model = build_model(config.img_height, config.img_width, class_names)
    model.summary()
    train_model(model, train_ds, val_ds)
    model.save("model.keras")
    print("Model saved.")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description='Train a model with or without GPU.')
    parser.add_argument('--gpu', action='store_true', help='Use GPU for training if available')
    args = parser.parse_args()
    
    set_gpu_config(args.gpu)
    main()
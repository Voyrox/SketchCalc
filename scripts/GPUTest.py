import tensorflow as tf

def check_gpu():
    gpus = tf.config.list_physical_devices('GPU')
    if gpus:
        print("GPUs detected:")
        for gpu in gpus:
            print(f" - {gpu.name}")
    else:
        print("No GPUs detected.")

if __name__ == "__main__":
    print("TensorFlow version:", tf.__version__)
    check_gpu()

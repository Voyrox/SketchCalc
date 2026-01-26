import tensorflow as tf
import argparse

def convert_keras_to_pb(keras_model_path, saved_model_dir):
    keras_model = tf.keras.models.load_model(keras_model_path)

    tf.saved_model.save(keras_model, saved_model_dir)

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description='Convert Keras model to TensorFlow SavedModel')
    parser.add_argument('-i', '--input', required=True, help='Path to the Keras model file (.keras)')
    parser.add_argument('-o', '--output', required=True, help='Path to save the TensorFlow SavedModel')

    args = parser.parse_args()

    convert_keras_to_pb(args.input, args.output)

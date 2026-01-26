import argparse
import tensorflow as tf
import tensorflowjs as tfjs

def convert_model(keras_model_path, output_dir):
    model = tf.keras.models.load_model(keras_model_path)
    
    tfjs.converters.save_keras_model(model, output_dir)

    print(f"Model has been successfully converted to TensorFlow.js format and saved in '{output_dir}'.")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description='Convert .keras model to TensorFlow.js format')
    parser.add_argument('-i', '--input', required=True, help='Path to the input .keras model file')
    parser.add_argument('-o', '--output', required=True, help='Path to the output directory to save the model.json and binary weight files')
    
    args = parser.parse_args()
    
    convert_model(args.input, args.output)

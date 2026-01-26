import argparse
import tensorflow as tf

def convert_model(keras_model_path, tflite_model_path):
    model = tf.keras.models.load_model(keras_model_path)
    
    converter = tf.lite.TFLiteConverter.from_keras_model(model)
    tflite_model = converter.convert()
    
    with open(tflite_model_path, 'wb') as f:
        f.write(tflite_model)

    print(f"Model has been successfully converted to TensorFlow Lite format and saved as '{tflite_model_path}'.")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description='Convert .keras model to TensorFlow Lite format')
    parser.add_argument('-i', '--input', required=True, help='Path to the input .keras model file')
    parser.add_argument('-o', '--output', required=True, help='Path to save the output .tflite model file')
    
    args = parser.parse_args()
    
    convert_model(args.input, args.output)

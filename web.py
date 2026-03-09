import os
import random
import string
import cv2
import numpy as np
from tensorflow.keras.models import load_model
import tensorflow as tf
from flask import Flask, request, jsonify
from flask_cors import CORS
import io
import config

app = Flask(__name__)
CORS(app)

def safe_load_model(model_path):
    try:
        return load_model(model_path)
    except Exception as e:
        print(f"Error loading model: {e}")
        raise RuntimeError(f"Error loading model from {model_path}")

try:
    model = safe_load_model("model.keras")
except RuntimeError as e:
    print(e)
    raise

symbol_map = {
    "Infinity": "∞",
    "PI": "π",
    "divide": "÷",
    "int": "∫",
    "sqrt": "√",
    "times": "*",
    "sum": "Σ",
    "gt": ">",
    "lt": "<",
    "gte": "≥",
    "lte": "≤",
}

class_names = [symbol_map.get(name, name) for name in config.class_names]
img_height, img_width = 110, 110

def load_image(image_path, target_size=(110, 110)):
    try:
        image = cv2.imread(image_path)
        image = cv2.resize(image, target_size)
        return image
    except Exception as e:
        print(f"Error loading image: {e}")
        raise ValueError(f"Error processing image at {image_path}")

def predict_with_confidence(model, file, class_names, img_height, img_width):
    try:
        img = tf.keras.preprocessing.image.load_img(io.BytesIO(file.read()), target_size=(img_height, img_width))
        img_array = tf.expand_dims(tf.keras.preprocessing.image.img_to_array(img), 0)
        score = tf.nn.softmax(model.predict(img_array)[0])
        predicted_label = class_names[np.argmax(score)]
        confidence = 100 * np.max(score)
        return predicted_label, confidence
    except Exception as e:
        print(f"Error during prediction: {e}")
        raise RuntimeError(f"Error predicting with model for file {file.filename}")

@app.route('/predict', methods=['POST'])
def predict():
    if 'file' not in request.files:
        return jsonify({"error": "No file part"}), 400
    file = request.files['file']
    if file.filename == '':
        return jsonify({"error": "No selected file"}), 400
    if file and file.filename.lower().endswith(('.jpg', '.jpeg', '.png')):
        try:
            predicted_label, confidence = predict_with_confidence(model, file, class_names, img_height, img_width)
            return jsonify({"predicted_label": predicted_label, "confidence": f"{confidence:.2f}"}), 200
        except RuntimeError as e:
            return jsonify({"error": str(e)}), 500
    else:
        return jsonify({"error": "Invalid file type"}), 400

def randomkey(length=6):
    return ''.join(random.choice(string.ascii_letters + string.digits) for i in range(length))

@app.route('/save', methods=['POST'])
def save():
    if 'file' not in request.files or 'label' not in request.form:
        return jsonify({"error": "No file or label part"}), 400

    file = request.files['file']
    label = request.form['label']

    if file.filename == '':
        return jsonify({"error": "No selected file"}), 400

    if file and file.filename.lower().endswith(('.jpg', '.jpeg', '.png')):
        try:
            save_dir = os.path.join('dataset', label)
            os.makedirs(save_dir, exist_ok=True)

            filename = f"{randomkey(6)}.png"
            file_path = os.path.join(save_dir, filename)

            file.save(file_path)
            return jsonify({"message": f"File saved as {file_path}"}), 200
        except Exception as e:
            return jsonify({"error": str(e)}), 500
    else:
        return jsonify({"error": "Invalid file type"}), 400

if __name__ == "__main__":
    app.run(host='0.0.0.0', port=5000, debug=False)

from tensorflow import keras
import tensorflowjs as tfjs

# Load the .keras model
model = keras.models.load_model("model.keras")

# Convert to tfjs format (creates model.json and binary .bin weights)
tfjs.converters.save_keras_model(model, "./web_model")

from tensorflow import keras
import tensorflowjs as tfjs

model = keras.models.load_model("model.keras")
tfjs.converters.save_keras_model(model, "./web_model")

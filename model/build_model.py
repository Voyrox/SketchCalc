import tensorflow as tf

def build_model(img_height, img_width, num_classes):
    model = tf.keras.Sequential([
        tf.keras.layers.Rescaling(1. / 255, input_shape=(img_height, img_width, 3)),

        tf.keras.layers.Conv2D(16, kernel_size=3, padding='same', activation='relu', use_bias=True),
        tf.keras.layers.MaxPool2D(),
        tf.keras.layers.BatchNormalization(),

        tf.keras.layers.Conv2D(32, kernel_size=3, padding='same', activation='relu', use_bias=True),
        tf.keras.layers.MaxPool2D(),

        tf.keras.layers.Conv2D(64, 3, padding='same', activation='relu'),
        tf.keras.layers.MaxPool2D(2),
        tf.keras.layers.Dropout(0.3),

        tf.keras.layers.Conv2D(128, 3, padding='same', activation='relu'),
        tf.keras.layers.MaxPool2D(2),
        tf.keras.layers.Dropout(0.3),

        tf.keras.layers.Conv2D(256, 3, padding='same', activation='relu'),
        tf.keras.layers.MaxPool2D(2),

        tf.keras.layers.Flatten(),
        tf.keras.layers.Dense(2048, activation='relu', use_bias=True),
        tf.keras.layers.Dropout(0.2),
        tf.keras.layers.Dense(1024, activation='relu', use_bias=True),
        tf.keras.layers.Dense(num_classes, use_bias=True)
        ])
    return model

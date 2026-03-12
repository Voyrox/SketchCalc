import pathlib
import tensorflow as tf
import numpy as np
import config

def load_datasets(img_height, img_width, batch_size=config.batch_size):
    data_dir = pathlib.Path(config.train_data_dir)

    train_ds = tf.keras.preprocessing.image_dataset_from_directory(
      data_dir,
      validation_split=0.2,
      subset="training",
      seed=123,
      image_size=(img_height, img_width),
      batch_size=batch_size)

    val_ds = tf.keras.preprocessing.image_dataset_from_directory(
      data_dir,
      validation_split=0.2,
      subset="validation",
      seed=123,
      image_size=(img_height, img_width),
      batch_size=batch_size)

    class_names = train_ds.class_names
    print(class_names)

    with open('./config.py', 'r') as file:
        lines = file.readlines()

    with open('./config.py', 'w') as file:
        for line in lines:
            if line.startswith('class_names'):
                file.write(f'class_names = {class_names}\n')
            else:
                file.write(line)

    normalization_layer = tf.keras.layers.Rescaling(1. / 255)

    normalized_ds = train_ds.map(lambda x, y: (normalization_layer(x), y))
    image_batch, labels_batch = next(iter(normalized_ds))
    first_image = image_batch[0]
    print(np.min(first_image), np.max(first_image))

    AUTOTUNE = tf.data.AUTOTUNE

    train_ds = train_ds.cache().prefetch(buffer_size=AUTOTUNE)
    val_ds = val_ds.cache().prefetch(buffer_size=AUTOTUNE)

    return train_ds, val_ds, len(class_names)

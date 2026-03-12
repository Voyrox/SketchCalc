import tensorflow as tf
import config

def train_model(model, train_ds, val_ds, learning_rate=config.learning_rate, epochs=config.epochs):
    model.compile(
        optimizer=tf.keras.optimizers.SGD(learning_rate, momentum=0.7),
        loss=tf.losses.SparseCategoricalCrossentropy(from_logits=True),
        metrics=['accuracy'])

    history = model.fit(
        train_ds,
        validation_data=val_ds,
        epochs=epochs,
        verbose=1,
    ).history
    return history

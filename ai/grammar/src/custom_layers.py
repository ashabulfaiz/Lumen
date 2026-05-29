"""Custom Keras layers for grammar acceptability modeling."""
import tensorflow as tf


@tf.keras.utils.register_keras_serializable(package="grammar_ai")
class GrammarAttentionPooling(tf.keras.layers.Layer):
    """
    Learned attention weights over sequence positions before classification/regression heads.
    """

    def __init__(self, units: int = 64, **kwargs):
        super().__init__(**kwargs)
        self.units = units
        self.supports_masking = True
        self.score_dense = tf.keras.layers.Dense(units, activation="tanh")
        self._built_dense = False
        self.context_vector = self.add_weight(
            name="context_vector",
            shape=(units, 1),
            initializer="glorot_uniform",
            trainable=True,
        )

    def build(self, input_shape):
        if not self._built_dense:
            self.score_dense.build(input_shape)
            self._built_dense = True
        super().build(input_shape)

    def call(self, inputs, mask=None):
        # inputs: (batch, seq_len, features)
        scores = tf.matmul(self.score_dense(inputs), self.context_vector)
        scores = tf.squeeze(scores, axis=-1)

        if mask is None and hasattr(inputs, "_keras_mask"):
            mask = inputs._keras_mask

        if mask is not None:
            mask = tf.cast(mask, scores.dtype)
            scores = scores + (1.0 - mask) * -1e9

        weights = tf.nn.softmax(scores, axis=1)
        weights = tf.expand_dims(weights, axis=-1)
        pooled = tf.reduce_sum(inputs * weights, axis=1)
        return pooled

    def get_config(self):
        config = super().get_config()
        config.update({"units": self.units})
        return config

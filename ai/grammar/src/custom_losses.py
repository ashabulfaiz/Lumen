"""Custom multi-task loss for classification + regression."""
import tensorflow as tf

from src.config import CLASSIFICATION_WEIGHT, REGRESSION_WEIGHT


@tf.keras.utils.register_keras_serializable(package="grammar_ai")
class GrammarMultiTaskLoss(tf.keras.losses.Loss):
    """
    Weighted sum of binary cross-entropy (acceptability class) and MAE (score regression).
    """

    def __init__(
        self,
        classification_weight: float = CLASSIFICATION_WEIGHT,
        regression_weight: float = REGRESSION_WEIGHT,
        **kwargs,
    ):
        super().__init__(**kwargs)
        self.classification_weight = classification_weight
        self.regression_weight = regression_weight
        self.bce = tf.keras.losses.BinaryCrossentropy()
        self.mae = tf.keras.losses.MeanAbsoluteError()

    def call(self, y_true, y_pred):
        y_cls_true, y_reg_true = y_true
        y_cls_pred, y_reg_pred = y_pred

        y_cls_true = tf.reshape(y_cls_true, (-1, 1))
        y_reg_true = tf.reshape(y_reg_true, (-1, 1))
        y_cls_pred = tf.reshape(y_cls_pred, (-1, 1))
        y_reg_pred = tf.reshape(y_reg_pred, (-1, 1))

        cls_loss = tf.reduce_mean(
            tf.keras.losses.binary_crossentropy(y_cls_true, y_cls_pred)
        )
        reg_loss = tf.reduce_mean(tf.abs(y_reg_true - y_reg_pred))
        return self.classification_weight * cls_loss + self.regression_weight * reg_loss

    def get_config(self):
        config = super().get_config()
        config.update(
            {
                "classification_weight": self.classification_weight,
                "regression_weight": self.regression_weight,
            }
        )
        return config

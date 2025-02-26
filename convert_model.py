import tensorflowjs as tfjs
import tensorflow as tf

def convert_model():
    # Load the Keras model
    model = tf.keras.models.load_model('dtln_aec.h5', compile=False)
    
    # Convert and save the model to TensorFlow.js format
    tfjs.converters.save_keras_model(model, 'public/tfjs_model')
    print("Model conversion completed successfully!")

if __name__ == "__main__":
    convert_model()
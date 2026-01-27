from flask import Flask, Response
from flask_socketio import SocketIO, emit
from flask_cors import CORS  # 🔹 Import CORS
from keras.models import load_model
from keras.preprocessing import image
import cv2
import numpy as np
import time

app = Flask(__name__)
CORS(app)  # 🔹 Enable CORS for all routes
socketio = SocketIO(app, cors_allowed_origins="*")

# Load the pre-trained model

model_best = load_model('./face_model.h5')

# Classes for 7 emotional states
class_names = ['Angry', 'Disgusted', 'Fear', 'Happy', 'Sad', 'Surprise', 'Neutral']

# Load the pre-trained face cascade
face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')

# Emotion tracking variables
latest_emotion = "Neutral"
stable_emotion = "Neutral"
emotion_counter = 0
emotion_threshold = 5


def generate_frames():
    global latest_emotion, stable_emotion, emotion_counter
    cap = cv2.VideoCapture(0)

    try:
        while True:
            success, frame = cap.read()
            if not success:
                break

            gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
            faces = face_cascade.detectMultiScale(gray, scaleFactor=1.3, minNeighbors=5, minSize=(30, 30))

            for (x, y, w, h) in faces:
                face_roi = frame[y:y + h, x:x + w]

                # Preprocess the face image
                face_image = cv2.resize(face_roi, (48, 48))
                face_image = cv2.cvtColor(face_image, cv2.COLOR_BGR2GRAY)
                face_image = image.img_to_array(face_image)
                face_image = np.expand_dims(face_image, axis=0)

                # Predict emotion
                predictions = model_best.predict(face_image)
                detected_emotion = class_names[np.argmax(predictions)]

                # Stabilize the emotion
                if detected_emotion == latest_emotion:
                    emotion_counter += 1
                else:
                    emotion_counter = 0

                if emotion_counter >= emotion_threshold:
                    stable_emotion = detected_emotion
                    emotion_counter = 0
                    socketio.emit('emotion_update', {'emotion': stable_emotion})

                latest_emotion = detected_emotion

                # Draw the label and box
                cv2.putText(frame, f'Emotion: {stable_emotion}', (x, y - 10),
                            cv2.FONT_HERSHEY_SIMPLEX, 0.9, (0, 0, 255), 2)
                cv2.rectangle(frame, (x, y), (x + w, y + h), (0, 0, 255), 2)

            ret, buffer = cv2.imencode('.jpg', frame)
            frame = buffer.tobytes()

            yield (b'--frame\r\n'
                   b'Content-Type: image/jpeg\r\n\r\n' + frame + b'\r\n')

            time.sleep(0.03)

    except Exception as e:
        print(f"Error: {str(e)}")
    finally:
        cap.release()


@app.route('/video_feed')
def video_feed():
    return Response(generate_frames(), mimetype='multipart/x-mixed-replace; boundary=frame')


@app.route('/emotion')
def get_emotion():
    global stable_emotion
    return {'emotion': stable_emotion}


if __name__ == '__main__':
    socketio.run(app, host='0.0.0.0', port=3000, debug=True)

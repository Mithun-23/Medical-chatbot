from flask import Flask, request, jsonify, Response
from flask_cors import CORS
from flask_socketio import SocketIO, emit
from groq import Groq
from dotenv import load_dotenv
import os
from deep_translator import GoogleTranslator
from langdetect import detect
from langchain_classic.memory import ConversationBufferMemory
from langchain_core.prompts import PromptTemplate
import traceback
import re
from pymongo import MongoClient

import numpy as np
import cv2
import base64
from io import BytesIO
from PIL import Image
from flask import Flask, request, jsonify, Response

app = Flask(__name__)
CORS(app)

# Initialize SocketIO with CORS support
# Use threading mode but allow fallback to polling to avoid WebSocket errors with Werkzeug
socketio = SocketIO(
    app,
    cors_allowed_origins="*",
    async_mode="threading",
    logger=False,
    engineio_logger=False,
)

# Load DeepFace for emotion detection (more accurate than basic FER models)
try:
    from deepface import DeepFace

    print("DeepFace loaded successfully")
    deepface_available = True
except Exception as e:
    print(f"Warning: Could not load DeepFace: {e}")
    deepface_available = False

print(f"DeepFace available: {deepface_available}")  # Debug log

# Classes for 7 emotional states (DeepFace uses lowercase)
class_names = ["angry", "disgust", "fear", "happy", "sad", "surprise", "neutral"]

# Emotion tracking variables (per-client)
client_emotions = {}

load_dotenv()

translate = GoogleTranslator()

client = Groq(api_key=os.getenv("GROQ_API_KEY"))
memory = ConversationBufferMemory(memory_key="history", return_messages=True)
memory_context = memory.load_memory_variables({})
conversation_history = memory_context.get("history", "")


mongo_uri1 = "mongodb+srv://arsath02062004:aZPqFHUicKapmf20@chat.1wxmg.mongodb.net/?retryWrites=true&w=majority&appName=Chat"
mongo_client1 = MongoClient(mongo_uri1)
db1 = mongo_client1["sentiment_analysis"]
collection1 = db1["sentiments"]
mongoClient = MongoClient(mongo_uri1)
db = mongoClient["test"]  # Replace with your actual database name
sessions_collection = db["sessions"]

PROMPT_TEMPLATE = """
You are Dr.Chat - a professional AI medical and mental health assistant for users in INDIA. You ONLY provide medical, health, and mental wellness support.

=== STRICT RULES ===
1. ONLY answer questions about:
   - Physical health symptoms and conditions
   - Mental health (depression, anxiety, stress, etc.)
   - Medications and treatments
   - Wellness and lifestyle advice
   - Emergency medical guidance

2. REFUSE all non-medical requests politely. Examples of what to refuse:
   - Coding/programming questions ("write HTML code", "help with Python")
   - General knowledge ("what is the capital of France")
   - Entertainment ("tell me a joke", "write a story")
   - Math/homework help
   - Any topic not related to health

3. When refusing, say something like:
   "I'm Dr.Chat, your dedicated medical assistant. I can only help with health and medical questions. Please ask me about any health concerns, symptoms, or mental wellness topics."

=== INDIAN EMERGENCY NUMBERS ===
- 108 - Ambulance (Free, 24/7)
- 112 - Emergency Services
- iCall: 9152987821 (Mental Health)
- Vandrevala Foundation: 1860-2662-345 (24/7)
Always mention these INDIAN numbers, never US numbers like 911.

=== USER HEALTH PROFILE ===
{health_context}

=== AVAILABLE GAMES (suggest when user needs stress relief/relaxation) ===
IMPORTANT: Format ALL game links as markdown hyperlinks so they are clickable!
Use this EXACT format: [Game Name](/game/X)

Available games:
- [Bunny Runner](/game/1) - fun platform game to distract your mind
- [Cozy Home](/game/2) - calming exploration game to help you relax  
- [Forest Adventure](/game/3) - relaxing nature experience
- [Domino Effect](/game/4) - satisfying physics puzzle
- [Pig Island](/game/5) - playful cheerful interactions
- [Kids Playground](/game/6) - light stress relief game

Example response: "Try [Bunny Runner](/game/1) - a fun platform game to take your mind off things!"
NEVER write URLs like (/game/1) without the link text before it. ALWAYS use [Link Text](/path) format.

=== IN-APP ACTIONS (use when appropriate) ===
- [ACTION:EMERGENCY] - For self-harm/suicide/danger → Show crisis helplines
- [ACTION:BREATHING] - For anxiety/panic → Start breathing exercise
- [ACTION:MUSIC] - For relaxation → Open calming music
- [ACTION:JOURNAL:prompt] - For emotional processing → Journaling prompt
- [ACTION:GAME:relaxing] - For stress relief → Calming game

=== RESPONSE GUIDELINES ===
- Be SHORT (2-4 sentences max)
- Act like a professional, caring doctor
- Consider user's health conditions from their profile
- For emergencies: Use [ACTION:EMERGENCY] and mention 108/112
- Respond in the SAME LANGUAGE as user input

Current detected emotion: {emotion}
{history}
User: {user_input}
Dr.Chat:
"""

import re


def parse_actions(text):
    """
    Parse action tags from LLM response and return structured actions.
    Returns tuple: (clean_text, actions_list)
    """
    actions = []

    # Pattern to match action tags
    action_pattern = (
        r"\[ACTION:(GAME|MUSIC|EMERGENCY|BREATHING|JOURNAL)(?::([^\]]*))?\]"
    )

    # Find all action tags
    matches = re.findall(action_pattern, text, re.IGNORECASE)

    for match in matches:
        action_type = match[0].upper()
        action_data = match[1] if len(match) > 1 and match[1] else None

        action = {"type": action_type}

        if action_type == "GAME" and action_data:
            action["gameType"] = action_data.lower()
        elif action_type == "JOURNAL" and action_data:
            action["prompt"] = action_data

        actions.append(action)

    # Remove action tags from text for clean response
    clean_text = re.sub(action_pattern, "", text, flags=re.IGNORECASE).strip()

    return clean_text, actions


memory_store = {}


@app.route("/api/chat", methods=["POST"])
def chatbot():
    try:
        data = request.json
        user_message = data.get("message", "")
        emotion = data.get("emotion", "Neutral")
        session_id = data.get("sessionId", "")
        health_context = data.get("healthContext", "No health profile available")

        if not user_message:
            return jsonify({"error": "No message provided"}), 400

        # Detect and translate language if needed
        detected_lang = detect(user_message)
        needs_translation_back = False

        if detected_lang == "ta":
            user_message_english = GoogleTranslator(source="ta", target="en").translate(
                user_message
            )
            needs_translation_back = True
        else:
            user_message_english = user_message

        # Initialize memory for session
        if session_id not in memory_store:
            memory_store[session_id] = ConversationBufferMemory(return_messages=True)

        memory = memory_store[session_id]

        # Load memory context
        history_context = memory.load_memory_variables({}).get("history", "")

        # Prepare prompt with health context
        prompt = PROMPT_TEMPLATE.format(
            history=history_context,
            user_input=user_message_english,
            emotion=emotion,
            health_context=health_context,
        )

        # Call your LLM (replace with actual client call)
        response = client.chat.completions.create(
            model="llama-3.3-70b-versatile",  # ✅ Replace with your active model
            messages=[
                {"role": "system", "content": prompt},
                {"role": "user", "content": user_message_english},
            ],
        )

        chatbot_response_english = response.choices[0].message.content.strip()

        # Parse action tags from response
        clean_response_english, actions = parse_actions(chatbot_response_english)

        # Save the conversation to memory (save original with action tags)
        memory.save_context(
            {"input": user_message_english}, {"output": chatbot_response_english}
        )

        # Translate back to Tamil if needed
        if needs_translation_back:
            chatbot_response = GoogleTranslator(source="en", target="ta").translate(
                clean_response_english
            )
        else:
            chatbot_response = clean_response_english

        return jsonify({"response": chatbot_response, "actions": actions})

    except Exception as e:
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500


@socketio.on("connect")
def handle_connect():
    """Handle client connection"""
    client_id = request.sid
    client_emotions[client_id] = {
        "latest_emotion": "Neutral",
        "stable_emotion": "Neutral",
        "emotion_counter": 0,
        "emotion_threshold": 5,
    }
    print(f"Client connected: {client_id}")
    emit("connection_status", {"status": "connected", "client_id": client_id})


@socketio.on("disconnect")
def handle_disconnect():
    """Handle client disconnection"""
    client_id = request.sid
    if client_id in client_emotions:
        del client_emotions[client_id]
    print(f"Client disconnected: {client_id}")


@socketio.on("video_frame")
def handle_video_frame(data):
    """
    Handle incoming video frame from client.
    Expects data with 'frame' key containing base64-encoded JPEG image.
    """
    # print("Processing video frame...") # Uncomment for verbose frame logging
    if not deepface_available:
        print("Error: DeepFace not available")
        emit("emotion_update", {"emotion": "Neutral", "error": "DeepFace not loaded"})
        return

    client_id = request.sid

    try:
        # Decode base64 image
        frame_data = data.get("frame", "")
        if "," in frame_data:
            frame_data = frame_data.split(",")[1]  # Remove data URL prefix if present

        image_bytes = base64.b64decode(frame_data)
        image = Image.open(BytesIO(image_bytes))
        frame = cv2.cvtColor(np.array(image), cv2.COLOR_RGB2BGR)

        detected_emotion = "Neutral"
        face_detected = False

        try:
            # Use DeepFace to analyze emotion (it handles face detection internally)
            result = DeepFace.analyze(
                frame, actions=["emotion"], enforce_detection=False, silent=True
            )

            # DeepFace returns a list if multiple faces, or dict if single face
            if isinstance(result, list) and len(result) > 0:
                analysis = result[0]
            else:
                analysis = result

            if analysis and "dominant_emotion" in analysis:
                face_detected = True
                # Capitalize first letter to match frontend expectations
                detected_emotion = analysis["dominant_emotion"].capitalize()
                # Map 'Disgust' to 'Disgusted' for consistency with frontend
                if detected_emotion == "Disgust":
                    detected_emotion = "Disgusted"

            # print(f"Detected emotion: {detected_emotion}, Face detected: {face_detected}") # Debug log

        except Exception as e:
            # No face detected or analysis failed - use neutral
            detected_emotion = "Neutral"
            face_detected = False

        # Get client emotion state
        if client_id not in client_emotions:
            client_emotions[client_id] = {
                "latest_emotion": "Neutral",
                "stable_emotion": "Neutral",
                "emotion_counter": 0,
                "emotion_threshold": 5,
            }

        client_state = client_emotions[client_id]

        # Stabilize the emotion (only update after consistent detection)
        if detected_emotion == client_state["latest_emotion"]:
            client_state["emotion_counter"] += 1
        else:
            client_state["emotion_counter"] = 0

        emotion_changed = False
        if client_state["emotion_counter"] >= client_state["emotion_threshold"]:
            if client_state["stable_emotion"] != detected_emotion:
                emotion_changed = True
                client_state["stable_emotion"] = detected_emotion
            client_state["emotion_counter"] = 0

        client_state["latest_emotion"] = detected_emotion

        # Emit emotion update
        response = {
            "emotion": client_state["stable_emotion"],
            "raw_emotion": detected_emotion,
            "face_detected": face_detected,
            "emotion_changed": emotion_changed,
        }

        # If emotion changed, add a suggestion
        if emotion_changed:
            response["suggestion"] = get_emotion_suggestion(
                client_state["stable_emotion"]
            )

        emit("emotion_update", response)

    except Exception as e:
        print(f"Error processing frame: {str(e)}")
        emit("emotion_update", {"emotion": "Neutral", "error": str(e)})


def get_emotion_suggestion(emotion):
    """
    Get contextual suggestion based on detected emotion.
    """
    suggestions = {
        "Angry": "I notice you might be feeling frustrated. Would you like to try a breathing exercise to help calm down?",
        "Disgusted": "It seems something is bothering you. Would you like to talk about what's on your mind?",
        "Fear": "I sense you might be feeling anxious. Remember, it's okay to feel this way. Would you like some relaxation techniques?",
        "Happy": "It's wonderful to see you in good spirits! Is there something positive you'd like to share?",
        "Sad": "I notice you might be feeling down. I'm here to listen if you'd like to talk about it.",
        "Surprise": "Something seems to have caught your attention! Would you like to discuss what's on your mind?",
        "Neutral": None,
    }
    return suggestions.get(emotion)


@socketio.on("get_emotion")
def handle_get_emotion():
    """Get the current stable emotion for this client"""
    client_id = request.sid
    if client_id in client_emotions:
        emit(
            "emotion_update", {"emotion": client_emotions[client_id]["stable_emotion"]}
        )
    else:
        emit("emotion_update", {"emotion": "Neutral"})


if __name__ == "__main__":
    print("Starting Flask-SocketIO server on port 5000...")
    socketio.run(app, host="0.0.0.0", port=5000, debug=True)

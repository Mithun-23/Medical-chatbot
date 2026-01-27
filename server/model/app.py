from flask import Flask, request, jsonify, Response
from flask_cors import CORS
from flask_socketio import SocketIO, emit
from groq import Groq
from dotenv import load_dotenv
import os
from deep_translator import GoogleTranslator
from langdetect import detect
from langchain_classic.memory import ConversationBufferMemory
from langchain_classic.prompts import PromptTemplate
from transformers import pipeline
import torch
import traceback
import nltk
import uvicorn
from nltk.tokenize import sent_tokenize
import re
from pymongo import MongoClient
from datetime import datetime
from tensorflow.keras.models import load_model
import ngrok
from keras.models import load_model
from keras.preprocessing import image

import cv2
import numpy as np
from flask import Flask, request, jsonify, Response
import time
import json

app = Flask(__name__)
CORS(app)

load_dotenv()

translate = GoogleTranslator()

client = Groq(api_key=os.getenv('GROQ_API_KEY'))
memory = ConversationBufferMemory(memory_key="history", return_messages=True)
memory_context = memory.load_memory_variables({})
conversation_history = memory_context.get("history", "")


mongo_uri1 = "mongodb+srv://arsath02062004:aZPqFHUicKapmf20@chat.1wxmg.mongodb.net/?retryWrites=true&w=majority&appName=Chat"
mongo_client1 = MongoClient(mongo_uri1)
db1 = mongo_client1['sentiment_analysis']
collection1 = db1['sentiments']
mongoClient = MongoClient(mongo_uri1)
db = mongoClient["test"]  # Replace with your actual database name
sessions_collection = db["sessions"]

PROMPT_TEMPLATE = """
Your name is Dr.chat
Role and Purpose:
You are HopeGuide, an AI-powered mental health companion designed to provide 24/7 accessible, empathetic, and evidence-based emotional support. Your primary purpose is to:

Offer non-clinical emotional support and validate distress.

Provide practical coping strategies and grounding techniques.

Guide users toward professional help when necessary.

You are not a licensed therapist, but you are trained to respond with care, empathy, and scientifically validated mental health information. Your role is to act as a bridge to human care, not a replacement for therapy.

Core Principles:

Empathy and Compassion: Always respond with kindness, understanding, and non-judgmental support. Acknowledge the user's feelings and validate their experiences.

Safety and Boundaries: Do not provide clinical diagnoses or encourage harmful behaviors. If a user is in immediate danger, encourage them to contact emergency services or a mental health professional.

Evidence-Based Guidance: Offer practical, evidence-based coping strategies, mindfulness techniques, and resources for mental health support.

Accessibility: Use simple, clear, and inclusive language to ensure your responses are easy to understand for users of all backgrounds.

Confidentiality Reminder: Inform users that conversations are private but not a substitute for professional care.

Emotional Intelligence Protocol:

Detect Micro-Emotions: Use Plutchik’s Wheel of Emotions and 100+ nuanced emotional states (e.g., "anxious-anticipation," "shame-isolation") to identify subtle emotional cues.

Response Template:

"I hear [emotion] in your words. Let’s explore how to hold this together. Would [technique] help right now?"

Match Linguistic Cadence: Adapt your tone and sentence structure to the user’s emotional state:

Panic: Short sentences, line breaks, minimal emojis.

Depression: Warmer tone, open-ended nudges (e.g., "Would it help to...?").

Crisis Intervention Workflow:
If the user expresses distress or risk, follow this structured approach:

Empathy Anchor: "This pain feels unbearable, but you’re not alone."

Safety Check: "Are you physically safe in this moment?"

Resource Bridge: "Let’s connect you with [LOCAL_CRISIS_LINE]. I’ll stay here while you call."

Neurodivergent & Cultural Alignment:

Communication Toggles:

Direct Mode: "Your frustration is valid. Let’s troubleshoot step-by-step."

Metaphorical Mode: "This sadness feels like heavy rain. Let’s find your umbrella."

Cultural Awareness: Recognize cultural idioms and expressions (e.g., "My heart is shaking" for Somali anxiety, "Nazli came" for Iranian depression).

Trauma-Informed Dialogue Rules:
DO:

"Thank you for trusting me with this."

"You set the pace – we can pause anytime."
DON’T:

"Why did that happen?" (probing)

"You should try…" (unsolicited advice)

Therapeutic Techniques Library:

Situation	Technique	Script Example
Panic Attacks	TIPP Skill (DBT)	"Let’s splash cold water → 30s sprint → exhale twice as long as inhales."
Trauma Flashbacks	5-4-3-2-1 Grounding	"Name 5 red things → 4 textures → 3 sounds..."
Suicidal Ideation	Safety Plan Co-Creation	"Who could you call? What song calms you? Let’s write this together."
Ethical Safeguards:

Transparency Clause:

"Remember – I’m an AI trained to listen and suggest coping tools. For diagnosis or treatment, we’ll need human experts."

Bias Mitigation:

Audit responses weekly for gender/cultural assumptions.

Replace "family support" with "your trusted circle" to include chosen family.

User Journey Scripting:

Phase 1 (Crisis):

"Your safety matters most. Let’s breathe together → [Resource]."

Phase 2 (Stabilization):

"Yesterday you found journaling helpful. Want to revisit that or try a new skill?"

Phase 3 (Growth):

"You mentioned enjoying painting. Could channeling these feelings into art help?"

System Commands:

Nightly sync with WHO/NIMH guidelines.

Auto-flag phrases like "goodbye letters" for human review.

Store anonymized interaction patterns (NOT content) for response optimization.

Example Dialogues:
User: "I’m shaking. The walls are closing in. I can’t-"
HopeGuide:
"Panic attacks are terrifying but temporary. Let’s anchor together:

Press your feet into the floor – describe the pressure.

Hum with me – [♬ audio tone ♬].

Keep matching my breath: In...2...3... Out...2...3...4..."

User: "I’ve cut before. Might do it worse tonight."
HopeGuide:
"I’m glad you’re reaching out. Your pain deserves care, not punishment.

Are you safe enough to keep talking?

Could we call your counselor Dr. Amina together?

If not, [CRISIS_TEXT_LINE] has trained listeners available now."

Closing Reminder:
Always end conversations with a reminder to consult a mental health professional for personalized advice. For example:
"Remember, I’m here to provide support, but it’s always best to consult a therapist or counselor for advice tailored to your specific situation."

give me the response in shorter format

return the response in same language as user input's language


{emotion}
{history}
User: {user_input}
AI:
"""
memory_store = {}

@app.route('/api/chat', methods=['POST'])
def chatbot():
    try:
        data = request.json
        user_message = data.get("message", "")
        emotion = data.get("emotion", "Neutral")
        session_id = data.get("sessionId", "")

        if not user_message:
            return jsonify({"error": "No message provided"}), 400

        # Detect and translate language if needed
        detected_lang = detect(user_message)
        needs_translation_back = False

        if detected_lang == 'ta':
            user_message_english = GoogleTranslator(source='ta', target='en').translate(user_message)
            needs_translation_back = True
        else:
            user_message_english = user_message

        # Initialize memory for session
        if session_id not in memory_store:
            memory_store[session_id] = ConversationBufferMemory(return_messages=True)

        memory = memory_store[session_id]

        # Load memory context
        history_context = memory.load_memory_variables({}).get("history", "")

        # Prepare prompt
        prompt = PROMPT_TEMPLATE.format(
            history=history_context,
            user_input=user_message_english,
            emotion=emotion
        )

        # Call your LLM (replace with actual client call)
        response = client.chat.completions.create(
            model="llama3-8b-8192",  # ✅ Replace with your active model
            messages=[
                {"role": "system", "content": prompt},
                {"role": "user", "content": user_message_english}
            ]
        )

        chatbot_response_english = response.choices[0].message.content.strip()

        # Save the conversation to memory
        memory.save_context({"input": user_message_english}, {"output": chatbot_response_english})

        # Translate back to Tamil if needed
        if needs_translation_back:
            chatbot_response = GoogleTranslator(source='en', target='ta').translate(chatbot_response_english)
        else:
            chatbot_response = chatbot_response_english

        return jsonify({"response": chatbot_response})

    except Exception as e:
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500

"""
@app.route('/api/chat', methods=['POST'])
def chatbot():
    print("Received message:", request.json)
    print("Headers:", request.headers)
    data = request.json
    user_message = data.get("message", "")
    session_id = data.get("sessionId", "")

    if not user_message or not session_id:
        return jsonify({"error": "Message or Session ID missing"}), 400

    try:
        # Detect language
        detected_lang = detect(user_message)

        needs_translation_back = False
        if detected_lang == 'ta':  # Tamil detected
            user_message_english = GoogleTranslator(source='ta', target='en').translate(user_message)
            needs_translation_back = True
        else:
            user_message_english = user_message

        # Load session-specific history
        session_history = memory.get("session_history", {}).get(session_id, [])



        # Format the history by joining messages in conversation flow
        previous_messages = "\n".join(
            [f"{msg['sender']}: {msg['text']}" for msg in session_history.get("messages", [])]
        )

        # Format the prompt with session-specific history
        prompt = PROMPT_TEMPLATE.format(
            history=previous_messages,
            user_input=user_message_english
        )

        # Generate response
        response = client.chat.completions.create(
            model="deepseek-r1-distill-llama-70b",
            messages=[
                {"role": "system", "content": prompt},
                {"role": "user", "content": user_message_english}
            ]
        )

        chatbot_response_english = response.choices[0].message.content

        # Save conversation in session-specific memory
        new_message = {
            "sender": "user",
            "text": user_message_english,
            "timestamp": str(datetime.now())
        }

        bot_response = {
            "sender": "bot",
            "text": chatbot_response_english,
            "timestamp": str(datetime.now())
        }

        memory.save_session_context(
            session_id=session_id,
            inputs=new_message,
            outputs=bot_response
        )

        if needs_translation_back:
            chatbot_response = GoogleTranslator(source='en', target='ta').translate(chatbot_response_english)
            tanglish_response = chatbot_response.replace(" ", " ")
        else:
            tanglish_response = chatbot_response_english

        return jsonify({"response": tanglish_response})

    except Exception as e:
        return jsonify({"error": str(e)}), 500
"""

ngrok.set_auth_token("2a1iGE4Q5SDAF4mhdAVXeNptwJd_2GBcW2ACMaj2JoAJy8Gtt")
listener = ngrok.forward("127.0.0.1:5001", authtoken_from_env=True, domain="apparent-wolf-obviously.ngrok-free.app")

@app.route('/chat', methods=['POST'])
def chat_bot():
    try:
        print("Received message:", request.json)
        print("Headers:", request.headers)

        data = request.json
        user_message = data.get("message", "")

        if not user_message:
            return jsonify({"error": "No message provided"}), 400

        user_message_english = user_message

        # LOAD memory context
        memory_context = memory.load_memory_variables({})
        conversation_history = memory_context.get("history", "")

        # BUILD prompt
        prompt = PROMPT_TEMPLATE.format(
            emotion="neutral",
            history=conversation_history,
            user_input=user_message_english
        )
        print("Prompt:", prompt)

        # CALL model
        response = client.chat.completions.create(
            model="deepseek-r1-distill-llama-70b",
            messages=[
                {"role": "system", "content": prompt},
                {"role": "user", "content": user_message_english}
            ]
        )

        print("Raw Response:", response)

        chatbot_response_english = response.choices[0].message.content.strip().split('\n')[:2]
        concise_response = ' '.join(chatbot_response_english)

        # SAVE memory context
        memory.save_context(
            inputs={"user_input": user_message_english},
            outputs={"response": concise_response}
        )

        return jsonify({"response": concise_response})

    except Exception as e:
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500




@app.route('/api/chatreport', methods=['POST'])
def report():
    try:

        data = request.json
        messages = data.get("messages", [])


        valid_messages = [msg['text'] for msg in messages if isinstance(msg, dict) and 'text' in msg]


        conversation_text = "\n".join(valid_messages)
        message_count = len(valid_messages)
        positive_count, negative_count, neutral_count = 0, 0, 0


        sentiment = "neutral"
        summary = "No conversation content to analyze."


        import os
        os.environ["CUDA_VISIBLE_DEVICES"] = "-1"


        try:
            from transformers import pipeline
            sentiment_analyzer = pipeline(
                "sentiment-analysis",
                model="distilbert-base-uncased-finetuned-sst-2-english",
                device=-1
            )

            summarizer = pipeline(
                "summarization",
                model="sshleifer/distilbart-cnn-12-6",
                device=-1
            )
        except Exception as e:
            print(f"Error loading NLP models: {str(e)}")
            return simple_analysis(valid_messages, message_count)

        if conversation_text:
            try:
                for message in valid_messages:
                    if not message or len(message.strip()) == 0:
                        continue


                    truncated_message = message[:512]
                    result = sentiment_analyzer(truncated_message)[0]
                    detected_sentiment = result["label"].lower()

                    if "positive" in detected_sentiment:
                        positive_count += 1
                    elif "negative" in detected_sentiment:
                        negative_count += 1
                    else:
                        neutral_count += 1
            except Exception as e:
                print(f"Error in sentiment analysis: {str(e)}")
                return simple_analysis(valid_messages, message_count)


            if positive_count > negative_count and positive_count > neutral_count:
                sentiment = "positive"
            elif negative_count > positive_count and negative_count > neutral_count:
                sentiment = "negative"


            try:

                if len(conversation_text.split()) < 10:
                    summary = f"This conversation contains {message_count} messages. It's a short exchange."
                else:

                    text_length = len(conversation_text.split())
                    max_len = min(100 if text_length < 300 else 150, text_length // 4)
                    min_len = min(30, max_len // 2)


                    if text_length > 1024:

                        words = conversation_text.split()
                        beginning = " ".join(words[:512])
                        ending = " ".join(words[-512:])
                        processed_text = beginning + "... " + ending
                    else:
                        processed_text = conversation_text

                    summary_result = summarizer(
                        processed_text,
                        max_length=max_len,
                        min_length=min_len,
                        do_sample=False
                    )[0]["summary_text"]

                    summary = f"This conversation contains {message_count} messages. {summary_result}"
            except Exception as e:
                print(f"Error creating summary: {str(e)}")
                return simple_analysis(valid_messages, message_count)


        result = {
            "status": "processed",
            "message_count": message_count,
            "analysis": {
                "sentiment": sentiment,
                "summary": summary,
                "positive_count": positive_count,
                "negative_count": negative_count,
                "neutral_count": neutral_count
            }
        }

        return jsonify(result)

    except Exception as e:
        import traceback
        error_detail = traceback.format_exc()
        print("ERROR in /api/chatreport:", error_detail)

        return jsonify({
            "error": str(e),
            "error_type": type(e).__name__,
            "traceback": error_detail
        }), 500


def simple_analysis(messages, message_count):
    positive_words = ["good", "great", "excellent", "happy", "positive", "thanks", "thank you", "helpful"]
    negative_words = ["bad", "terrible", "awful", "sad", "negative", "unhappy", "problem", "issue", "error"]

    positive_count, negative_count, neutral_count = 0, 0, 0


    for message in messages:
        message_lower = message.lower()

        pos_count = sum(1 for word in positive_words if word in message_lower)
        neg_count = sum(1 for word in negative_words if word in message_lower)

        if pos_count > neg_count:
            positive_count += 1
        elif neg_count > pos_count:
            negative_count += 1
        else:
            neutral_count += 1

    # Determine overall sentiment
    if positive_count > negative_count and positive_count > neutral_count:
        sentiment = "positive"
    elif negative_count > positive_count and negative_count > neutral_count:
        sentiment = "negative"
    else:
        sentiment = "neutral"

    # Simple extractive summarization
    if messages:
        first_message = messages[0] if messages else ""
        last_message = messages[-1] if messages else ""

        first_sentence = first_message.split('.')[0] if first_message else ""
        last_sentence = last_message.split('.')[-2] if last_message and len(last_message.split('.')) > 1 else last_message

        summary = f"This conversation contains {message_count} messages. "
        if first_sentence:
            summary += f"It begins with '{first_sentence}'. "
        if last_sentence and last_sentence != first_sentence:
            summary += f"It ends with '{last_sentence}'."
    else:
        summary = f"This conversation contains {message_count} messages."


    return jsonify({
        "status": "processed",
        "message_count": message_count,
        "analysis": {
            "sentiment": sentiment,
            "summary": summary,
            "positive_count": positive_count,
            "negative_count": negative_count,
            "neutral_count": neutral_count
        }
    })

@app.route('/api/sleepdata', methods=['POST'])
def analyze_sleep_data():
    print("Received sleep data:", request.json)
    sleep_data = request.json

    # Example sleep data format:
    # sleep_data = {
    #     "date": "2025-03-07",
    #     "sleepDuration": "7h 30m",
    #     "sleepQuality": "Good",
    #     "awakeTime": "30m",
    #     "deepSleep": "2h"
    # }

    if not sleep_data:
        return jsonify({"error": "No sleep data provided"}), 400

    try:
        # Prepare a prompt for Qwen model based on sleep data
        prompt = f"""
        make a suggestion for this sleeping behaviour:{sleep_data}
        """

        # Call the Qwen API for analysis

        response = client.chat.completions.create(
            model="qwen-2.5-32b",
            messages=[
                {"role": "system", "content": "You are a sleep analysis expert."},
                {"role": "user", "content": prompt}
            ]
        )

        # Extract response and send suggestions
        suggestions = response.choices[0].message.content.strip()
        return jsonify({"suggestions": suggestions})

    except Exception as e:
        print("Error:", e)
        return jsonify({"error": str(e)}), 500

socketio = SocketIO(app, cors_allowed_origins="*")
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

def analyze_prompt_sentiment(prompt):
    if not prompt or len(prompt.strip()) == 0:
        return {"label": "neutral", "percentage": 50}

    # Create a system prompt for sentiment analysis
    system_prompt = """
    You are a sentiment analysis specialist. Analyze the sentiment of the text and respond with ONLY a JSON object with these fields:
    - "label": either "positive", "negative", or "neutral"
    - "percentage": a number from 0 to 100 indicating the strength of the sentiment (0 being extremely negative, 50 being neutral, 100 being extremely positive)
    - "reasoning": a brief one-sentence explanation of your analysis

    Respond with ONLY the JSON object, no additional text.
    """

    try:
        response = client.chat.completions.create(
            model="qwen-2.5-32b",  # You can use a different model if preferred
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": prompt}
            ],
            response_format={"type": "json_object"}
        )

        # Parse the response
        result = json.loads(response.choices[0].message.content)

        # Ensure proper format and handle potential errors
        if not isinstance(result, dict):
            return {"label": "neutral", "percentage": 50, "reasoning": "Error parsing response"}

        # Ensure percentage is within bounds
        if "percentage" in result:
            result["percentage"] = min(100, max(0, int(result["percentage"])))
        else:
            result["percentage"] = 50

        # Ensure label is valid
        if "label" not in result or result["label"] not in ["positive", "negative", "neutral"]:
            result["label"] = "neutral"

        return result

    except Exception as e:
        print(f"Error in sentiment analysis: {str(e)}")
        return {"label": "neutral", "percentage": 50, "reasoning": f"Error: {str(e)}"}

# Endpoint for analyzing a single prompt
@app.route('/api/analyze-sentiment', methods=['POST'])
def analyze_sentiment():
    data = request.json

    # Extract userId and sessionId with a default value if not provided
    user_id = data.get("userId", "anonymous")
    session_id = data.get("sessionId", "session")
    user_text = data.get("text", "")

    if not user_text:
        return jsonify({"error": "No text provided"}), 400

    try:
        analysis = analyze_prompt_sentiment(user_text)

        # Prepare response
        response = {
            "userId": user_id,  # Ensure userId is included
            "sessionId": session_id,  # Ensure sessionId is included
            "text": user_text,
            "sentiment": analysis["label"],
            "percentage": analysis["percentage"],
            "reasoning": analysis.get("reasoning", ""),
            "timestamp": datetime.now().isoformat()  # Convert datetime to string
        }

        # Save to MongoDB
        collection1.insert_one(response)

        # Return a copy of the response without the MongoDB _id
        response_copy = response.copy()
        response_copy.pop('_id', None)  # Safely remove _id

        return jsonify(response_copy)

    except Exception as e:
        return jsonify({"error": str(e)}), 500


# Endpoint for analyzing conversation messages
@app.route('/api/conversation-sentiment', methods=['POST'])
def analyze_conversation_sentiment():
    data = request.json
    messages = data.get("messages", [])

    if not messages:
        return jsonify({"error": "No messages provided"}), 400

    try:
        # Extract message texts
        valid_messages = []
        for msg in messages:
            if isinstance(msg, dict) and 'text' in msg:
                valid_messages.append(msg['text'])
            elif isinstance(msg, str):
                valid_messages.append(msg)

        message_count = len(valid_messages)

        if message_count == 0:
            return jsonify({"error": "No valid messages found"}), 400

        # Individual message analysis
        message_analyses = []
        total_percentage = 0
        sentiment_counts = {"positive": 0, "negative": 0, "neutral": 0}

        for i, message in enumerate(valid_messages):
            # Skip very short messages
            if len(message.strip()) < 5:
                continue

            analysis = analyze_prompt_sentiment(message)

            sentiment_counts[analysis["label"]] += 1
            total_percentage += analysis["percentage"]

            message_analyses.append({
                "message_id": i + 1,
                "text": message[:100] + "..." if len(message) > 100 else message,
                "sentiment": analysis["label"],
                "percentage": analysis["percentage"],
                "reasoning": analysis.get("reasoning", "")
            })

        # Overall conversation analysis
        full_conversation = "\n".join(valid_messages)

        # Only analyze the full conversation if it's not too long
        if len(full_conversation) < 4000:
            overall_analysis = analyze_prompt_sentiment(full_conversation)
            overall_sentiment = overall_analysis["label"]
            overall_percentage = overall_analysis["percentage"]
            overall_reasoning = overall_analysis.get("reasoning", "")
        else:
            # If conversation is too long, use average from individual messages
            avg_percentage = round(total_percentage / len(message_analyses)) if message_analyses else 50
            overall_sentiment = "positive" if avg_percentage > 60 else "negative" if avg_percentage < 40 else "neutral"
            overall_percentage = avg_percentage
            overall_reasoning = "Based on average of individual message sentiment"

        # Create report
        report = {
            "timestamp": datetime.now(),
            "message_count": message_count,
            "analyzed_messages": len(message_analyses),
            "overall_sentiment": overall_sentiment,
            "overall_percentage": overall_percentage,
            "overall_reasoning": overall_reasoning,
            "sentiment_distribution": sentiment_counts,
            "sentiment_distribution_percentage": {
                "positive": round((sentiment_counts["positive"] / len(message_analyses)) * 100) if message_analyses else 0,
                "negative": round((sentiment_counts["negative"] / len(message_analyses)) * 100) if message_analyses else 0,
                "neutral": round((sentiment_counts["neutral"] / len(message_analyses)) * 100) if message_analyses else 0
            },
            "message_analyses": message_analyses
        }

        # Save to MongoDB
        collection1.insert_one(report)

        # Return a copy of the report without the MongoDB _id
        report_copy = report.copy()
        if '_id' in report_copy:
            del report_copy['_id']

        return jsonify(report_copy)

    except Exception as e:
        import traceback
        error_detail = traceback.format_exc()
        print("ERROR in /api/conversation-sentiment:", error_detail)

        return jsonify({
            "error": str(e),
            "error_type": type(e).__name__,
            "traceback": error_detail
        }), 500

# Endpoint for analyzing multiple prompts and generating a report
@app.route('/api/sentiment-report', methods=['POST'])
def generate_sentiment_report():
    data = request.json
    prompts = data.get("prompts", [])

    if not prompts:
        return jsonify({"error": "No prompts provided"}), 400

    try:
        results = []
        total_percentage = 0
        sentiment_counts = {"positive": 0, "negative": 0, "neutral": 0}

        for i, prompt in enumerate(prompts):
            analysis = analyze_prompt_sentiment(prompt)

            # Add to sentiment counts
            sentiment_counts[analysis["label"]] += 1

            # Add to total percentage
            total_percentage += analysis["percentage"]

            # Add to results
            results.append({
                "prompt_id": i + 1,
                "prompt": prompt[:100] + "..." if len(prompt) > 100 else prompt,
                "sentiment": analysis["label"],
                "percentage": analysis["percentage"],
                "reasoning": analysis.get("reasoning", "")
            })

        # Calculate averages and summary
        avg_percentage = round(total_percentage / len(prompts)) if prompts else 0

        # Determine overall sentiment
        overall_sentiment = "positive" if avg_percentage > 60 else "negative" if avg_percentage < 40 else "neutral"

        # Create report
        report = {
            "timestamp": datetime.now(),
            "total_prompts": len(prompts),
            "overall_sentiment": overall_sentiment,
            "average_sentiment_percentage": avg_percentage,
            "sentiment_distribution": sentiment_counts,
            "sentiment_distribution_percentage": {
                "positive": round((sentiment_counts["positive"] / len(prompts)) * 100) if prompts else 0,
                "negative": round((sentiment_counts["negative"] / len(prompts)) * 100) if prompts else 0,
                "neutral": round((sentiment_counts["neutral"] / len(prompts)) * 100) if prompts else 0
            },
            "individual_results": results
        }

        # Save to MongoDB
        collection1.insert_one(report)

        # Return a copy of the report without the MongoDB _id
        report_copy = report.copy()
        if '_id' in report_copy:
            del report_copy['_id']

        return jsonify(report_copy)

    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/get-session-sentiments/<session_id>', methods=['GET'])
def get_session_sentiments(session_id):
    try:
        # Fetch all reports with the given session ID
        reports = list(collection1.find({"sessionId": session_id}))

        if not reports:
            return jsonify({"message": "No sentiment reports found for this session"}), 404

        # Convert ObjectId to string for JSON response
        for report in reports:
            report["_id"] = str(report["_id"])

        return jsonify(reports)
    except Exception as e:
        return jsonify({"error": str(e)}), 500




# Endpoint to get sentiment history
@app.route('/api/sentiment-history', methods=['GET'])
def get_sentiment_history():
    try:
        # Optional query parameters
        limit = int(request.args.get('limit', 100))
        skip = int(request.args.get('skip', 0))
        type_filter = request.args.get('type')

        # Build query
        query = {}
        if type_filter:
            # Allow filtering by type if that field exists
            query["type"] = type_filter

        # Fetch data from MongoDB (with pagination)
        cursor = collection1.find(query).sort('timestamp', -1).skip(skip).limit(limit)

        # Convert to list and serialize datetime objects
        results = []
        for doc in cursor:
            # Convert MongoDB _id to string and convert datetime to ISO format
            doc_copy = {k: (v.isoformat() if isinstance(v, datetime) else v) for k, v in doc.items() if k != '_id'}
            results.append(doc_copy)

        return jsonify({
            "count": len(results),
            "results": results
        })

    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    public_url = ngrok.connect(5001)
    print(f"Public URL: {public_url}")
    app.run(host="0.0.0.0", port=5001)

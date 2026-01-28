from flask import Flask, request, jsonify
from flask_cors import CORS
import os
from datetime import datetime
import random

# Initialize Flask app
app = Flask(__name__)
CORS(app)

# Simple in-memory storage for chat history
chat_sessions = {}

# Predefined responses for medical chat
RESPONSES = [
    "Hello! I'm Dr.Chat, your medical assistant. How can I help you today?",
    "I understand you're seeking medical guidance. What symptoms are you experiencing?",
    "I'm here to provide health information and support. Please tell me more about your concern.",
    "Thank you for reaching out. I can help with general health questions. What would you like to know?",
    "As a medical assistant, I'm here to listen and provide helpful information. How are you feeling?",
    "I can offer general health advice and information. What specific health topic would you like to discuss?",
    "I'm Dr.Chat, ready to assist with your health questions. Please share what's on your mind.",
    "I'm here to provide medical information and support. What health concerns do you have today?",
    "I hear that you're feeling unwell. Can you tell me more about your symptoms?",
    "I'm concerned about your wellbeing. What seems to be troubling you most right now?",
    "Please don't hesitate to share what's bothering you. I'm here to help.",
    "I'd like to understand your situation better. What symptoms have you been experiencing?"
]

@app.route('/api/chat', methods=['POST'])
def chatbot():
    """Simple chat endpoint that works without API keys"""
    try:
        data = request.json
        user_message = data.get("message", "").strip()
        session_id = data.get("sessionId", "")
        
        if not user_message or not session_id:
            return jsonify({"error": "Message or Session ID missing"}), 400
        
        # Better response selection based on message content
        # Convert message to lowercase and get keywords
        msg_lower = user_message.lower()
        
        # Check for specific keywords to provide more relevant responses
        if 'depress' in msg_lower or 'sad' in msg_lower or 'upset' in msg_lower:
            bot_response = "I'm sorry to hear you're feeling this way. It's important to talk about these feelings. Can you tell me more about what's been bothering you?"
        elif 'fever' in msg_lower or 'temperature' in msg_lower or 'hot' in msg_lower:
            bot_response = "I understand you're concerned about a fever. Have you been monitoring your temperature? What other symptoms are you experiencing?"
        elif 'pain' in msg_lower or 'hurt' in msg_lower or 'ache' in msg_lower:
            bot_response = "I'm sorry you're experiencing pain. Can you describe where it hurts and how severe it feels?"
        elif 'tired' in msg_lower or 'fatigue' in msg_lower or 'exhausted' in msg_lower:
            bot_response = "Feeling tired can be concerning. How long have you been experiencing this fatigue? Are you getting adequate rest?"
        else:
            # Default varied responses
            response_index = (len(user_message) + len(session_id)) % len(RESPONSES)
            bot_response = RESPONSES[response_index]
        
        # Store conversation history
        if session_id not in chat_sessions:
            chat_sessions[session_id] = []
        
        # Add user message
        chat_sessions[session_id].append({
            "sender": "user",
            "text": user_message,
            "timestamp": str(datetime.now())
        })
        
        # Add bot response
        chat_sessions[session_id].append({
            "sender": "bot",
            "text": bot_response,
            "timestamp": str(datetime.now())
        })
        
        return jsonify({
            "sessionId": session_id,
            "response": bot_response
        })
        
    except Exception as e:
        return jsonify({"error": f"Chat processing failed: {str(e)}"}), 500

@app.route('/api/history/<session_id>', methods=['GET'])
def get_chat_history(session_id):
    """Get chat history for a specific session"""
    try:
        history = chat_sessions.get(session_id, [])
        return jsonify({"messages": history})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/sessions/<user_id>', methods=['GET'])
@app.route('/api/sessions', methods=['GET'])
def get_user_sessions(user_id=None):
    """Get all sessions for a user"""
    try:
        # Handle both path parameter and query parameter
        if not user_id:
            user_id = request.args.get('userId')
        
        if not user_id:
            return jsonify({"sessions": []})
        
        # For simplicity, return the session if it exists
        user_sessions = []
        for session_id in chat_sessions.keys():
            if session_id.startswith(user_id[:8]):  # Match by first 8 chars of user ID
                user_sessions.append({
                    "id": session_id,
                    "sessionId": session_id,
                    "title": f"Chat Session {len(user_sessions) + 1}",
                    "timestamp": chat_sessions[session_id][0]["timestamp"] if chat_sessions[session_id] else str(datetime.now()),
                    "createdAt": chat_sessions[session_id][0]["timestamp"] if chat_sessions[session_id] else str(datetime.now())
                })
        return jsonify(user_sessions)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({"status": "healthy", "service": "Medical Chatbot Simple Server"})

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    print(f"Starting Medical Chatbot Simple Server on port {port}")
    app.run(host='0.0.0.0', port=port, debug=True)
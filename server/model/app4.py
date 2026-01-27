from flask import Flask, request, jsonify
from groq import Groq
from flask_cors import CORS
from dotenv import load_dotenv
from pymongo import MongoClient
from datetime import datetime
import os
import json

# Initialize Flask app
app = Flask(__name__)
CORS(app)

# Load environment variables
load_dotenv()

# Initialize Groq client
client = Groq(api_key=os.getenv('GROQ_API_KEY'))

# MongoDB connection
mongo_uri1 = "mongodb+srv://arsath02062004:aZPqFHUicKapmf20@chat.1wxmg.mongodb.net/?retryWrites=true&w=majority&appName=Chat"
mongo_client1 = MongoClient(mongo_uri1)
db1 = mongo_client1['sentiment_analysis']
collection1 = db1['sentiments']

# Function to analyze sentiment using Groq API
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

# Main entry point
if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5001))
    app.run(host='0.0.0.0', port=port, debug=False)
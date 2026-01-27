from flask import Flask, jsonify
import subprocess

app = Flask(__name__)

@app.route('/run-game/<game>', methods=['GET'])
def run_game(game):
    try:
        if game == 'game1':
            subprocess.Popen(['python', 'game1.py'])
            return jsonify({"message": "Game 1 is running successfully!"})
        elif game == 'game2':
            subprocess.Popen(['python', 'game2.py'])
            return jsonify({"message": "Game 2 is running successfully!"})
        else:
            return jsonify({"error": "Invalid game name"}), 400
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)

from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
import os
from gtts import gTTS
import time
from pymongo import MongoClient
from werkzeug.security import generate_password_hash, check_password_hash
import jwt
from datetime import datetime, timedelta
from functools import wraps

app = Flask(__name__)
CORS(app, supports_credentials=True)


# Configuration
app.config['SECRET_KEY'] = 'your-secret-key-here'  # Change this in production
app.config['MONGO_URI'] = 'mongodb://localhost:27017/ragyverse'  # MongoDB connection URI

# Connect to MongoDB
client = MongoClient(app.config['MONGO_URI'])
db = client.get_database('ragyverse')
users_collection = db.users
history_collection = db.history

# JWT Token required decorator
def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = None
        if 'Authorization' in request.headers:
            token = request.headers['Authorization'].split(" ")[1]
        
        if not token:
            return jsonify({'message': 'Token is missing!'}), 401
            
        try:
            data = jwt.decode(token, app.config['SECRET_KEY'], algorithms=["HS256"])
            current_user = users_collection.find_one({'username': data['username']})
        except:
            return jsonify({'message': 'Token is invalid!'}), 401
            
        return f(current_user, *args, **kwargs)
    return decorated

# User Registration
@app.route('/register', methods=['POST', 'OPTIONS'])
def register():
    if request.method == 'OPTIONS':
        return '', 200
    data = request.json
    username = data.get('username')
    password = data.get('password')
    
    if not username or not password:
        return jsonify({'message': 'Username and password are required!'}), 400
    
    if users_collection.find_one({'username': username}):
        return jsonify({'message': 'User already exists!'}), 400
    
    hashed_password = generate_password_hash(password)
    users_collection.insert_one({
        'username': username,
        'password': hashed_password,
        'created_at': datetime.utcnow()
    })
    
    return jsonify({'message': 'User registered successfully!'}), 201

# User Login
@app.route('/login', methods=['POST'])
def login():
    data = request.json
    username = data.get('username')
    password = data.get('password')
    
    if not username or not password:
        return jsonify({'message': 'Username and password are required!'}), 400
    
    user = users_collection.find_one({'username': username})
    
    if not user or not check_password_hash(user['password'], password):
        return jsonify({'message': 'Invalid credentials!'}), 401
    
    token = jwt.encode({
        'username': username,
        'exp': datetime.utcnow() + timedelta(hours=24)
    }, app.config['SECRET_KEY'])
    
    return jsonify({
        'message': 'Login successful!',
        'token': token,
        'username': username
    }), 200

# Save user history
def save_history(username, action, details):
    history_collection.insert_one({
        'username': username,
        'action': action,
        'question': details.get('question', ''),
        'answer': details.get('text', ''),
        'audio_file': details.get('audio_file', ''),
        'timestamp': datetime.utcnow()
    })

# Get user history
@app.route('/history', methods=['GET'])
@token_required
def get_history(current_user):
    history = list(history_collection.find(
        {'username': current_user['username']},
        {'_id': 0}
    ).sort('timestamp', -1).limit(10))
    return jsonify(history), 200

# Modified TTS endpoint with user tracking
@app.route('/convert_to_speech', methods=['POST'])
@token_required
def convert_to_speech(current_user):
    data = request.json
    if not data or 'text' not in data:
        return jsonify({"error": "No text provided"}), 400
    
    text = data['text']
    question = data.get('question', '')  # Get the question if provided
    filename = f"response_{int(time.time())}"
    
    try:
        audio_path = os.path.join("static", f"{filename}.mp3")
        os.makedirs("static", exist_ok=True)
        tts = gTTS(text=text, lang='en')
        tts.save(audio_path)
        
        if not os.path.exists(audio_path):
            return jsonify({"error": "Failed to create audio file"}), 500
        
        # Save to user history with both question and answer
        save_history(
            current_user['username'],
            'text_to_speech',
            {
                'question': question,
                'text': text,
                'audio_file': filename
            }
        )
        
        audio_url = f"/audio/{filename}"
        return jsonify({"audio_url": audio_url}), 200
    except Exception as e:
        return jsonify({"error": f"Error generating speech: {e}"}), 500

@app.route('/audio/<filename>', methods=['GET'])
def get_audio(filename):
    audio_path = os.path.join("static", f"{filename}.mp3")
    if not os.path.exists(audio_path):
        return jsonify({"error": "Audio file not found"}), 404
    return send_file(audio_path, mimetype="audio/mpeg")

if __name__ == "__main__":
    print("Registered routes:")
    for rule in app.url_map.iter_rules():
        print(rule)

    app.run(host='0.0.0.0', port=5001)
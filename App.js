// src/App.js

import React from 'react';
import './App.css';
import SignalDashboard from './components/SignalDashboard';

function App() {
  return (
    <div className="App">
      <SignalDashboard />
    </div>
  );
}

export default App;
# app.py

import os
from flask import Flask, jsonify, request
import requests
import redis
from flask_caching import Cache
from flask_sqlalchemy import SQLAlchemy
from flask_jwt_extended import JWTManager, create_access_token, jwt_required, get_jwt_identity
from werkzeug.security import generate_password_hash, check_password_hash
from indicators import calculate_signals

app = Flask(__name__)

# Configuration for Redis Cache
app.config['CACHE_TYPE'] = 'RedisCache'
app.config['CACHE_REDIS_HOST'] = 'localhost'
app.config['CACHE_REDIS_PORT'] = 6379
cache = Cache(app)

# Database configuration
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///profitx.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
db = SQLAlchemy(app)

# JWT Configuration
app.config['JWT_SECRET_KEY'] = 'supersecretkey'  # Change to something secure in production
jwt = JWTManager(app)

# Redis connection
redis_conn = redis.Redis(host='localhost', port=6379)

# Database Models
class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    password = db.Column(db.String(120), nullable=False)
    preferences = db.Column(db.String(200), nullable=True)

class SignalHistory(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    pair = db.Column(db.String(50), nullable=False)
    timeframe = db.Column(db.String(10), nullable=False)
    signals = db.Column(db.Text, nullable=False)
    timestamp = db.Column(db.DateTime, nullable=False)

# Initialize the database
with app.app_context():
    db.create_all()

# OANDA API credentials
OANDA_API_URL = "https://api-fxtrade.oanda.com/v3/instruments"
OANDA_API_KEY = os.getenv('OANDA_API_KEY')

# User registration
@app.route('/api/register', methods=['POST'])
def register():
    username = request.json.get('username')
    password = request.json.get('password')

    if User.query.filter_by(username=username).first():
        return jsonify({"error": "User already exists"}), 400

    hashed_password = generate_password_hash(password)
    new_user = User(username=username, password=hashed_password)
    db.session.add(new_user)
    db.session.commit()

    return jsonify({"message": "User created successfully"}), 201

# User login
@app.route('/api/login', methods=['POST'])
def login():
    username = request.json.get('username')
    password = request.json.get('password')

    user = User.query.filter_by(username=username).first()

    if user and check_password_hash(user.password, password):
        access_token = create_access_token(identity=user.id)
        return jsonify({"token": access_token}), 200

    return jsonify({"error": "Invalid credentials"}), 401

# Update user preferences (e.g., pair selection)
@app.route('/api/preferences', methods=['PUT'])
@jwt_required()
def update_preferences():
    user_id = get_jwt_identity()
    user = User.query.get(user_id)

    preferences = request.json.get('preferences')
    user.preferences = preferences
    db.session.commit()

    return jsonify({"message": "Preferences updated successfully"}), 200

# Fetch live trading signals with authentication
@app.route('/api/signals', methods=['GET'])
@jwt_required()  # Require authentication
def get_trading_signals():
    pair = request.args.get('pair', 'EUR/USD')
    timeframe = request.args.get('timeframe', 'M1')
    user_id = get_jwt_identity()

    # Check if cached data exists for this pair
    cached_signals = redis_conn.get(f"signals_{pair}_{timeframe}")
    if cached_signals:
        return jsonify({'signals': cached_signals.decode('utf-8')})

    # Fetch price data from OANDA API
    candles_url = f"{OANDA_API_URL}/{pair}/candles"
    headers = {
        'Authorization': f"Bearer {OANDA_API_KEY}"
    }
    params = {
        'granularity': timeframe
    }
    response = requests.get(candles_url, headers=headers, params=params)

    if response.status_code == 200:
        data = response.json()

        # Process indicators
        signals = calculate_signals(data['candles'])

        # Cache the result in Redis
        redis_conn.set(f"signals_{pair}_{timeframe}", signals, ex=60)

        # Store signal history in the database
        signal_history = SignalHistory(
            user_id=user_id,
            pair=pair,
            timeframe=timeframe,
            signals=str(signals),
            timestamp=datetime.utcnow()
        )
        db.session.add(signal_history)
        db.session.commit()

        return jsonify({'signals': signals})

    return jsonify({'error': 'Failed to fetch data from OANDA'}), 500

if __name__ == "__main__":
    app.run(debug=True, host='0.0.0.0', port=5000)

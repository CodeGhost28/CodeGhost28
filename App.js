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
from datetime import datetime

app = Flask(__name__)

# Redis and database configurations
app.config['CACHE_TYPE'] = 'RedisCache'
app.config['CACHE_REDIS_HOST'] = 'localhost'
app.config['CACHE_REDIS_PORT'] = 6379
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///profitx.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['JWT_SECRET_KEY'] = os.getenv('JWT_SECRET_KEY', 'supersecretkey')
db = SQLAlchemy(app)
cache = Cache(app)
jwt = JWTManager(app)
redis_conn = redis.Redis(host='localhost', port=6379)

# Alpha Vantage API settings
ALPHA_VANTAGE_API_KEY = os.getenv('ALPHA_VANTAGE_API_KEY')
ALPHA_VANTAGE_BASE_URL = "https://www.alphavantage.co/query"

# Models for Users and Historical Data
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

with app.app_context():
    db.create_all()

# Fetch trading signals using Alpha Vantage API
def fetch_indicator(symbol, indicator, interval):
    params = {
        'function': indicator,
        'symbol': symbol,
        'interval': interval,
        'apikey': ALPHA_VANTAGE_API_KEY
    }
    response = requests.get(ALPHA_VANTAGE_BASE_URL, params=params)
    if response.status_code == 200:
        return response.json()
    else:
        return None

# Fetch signals and combine multiple indicators
@app.route('/api/signals', methods=['GET'])
@jwt_required()
def get_trading_signals():
    pair = request.args.get('pair', 'EURUSD')
    interval = request.args.get('timeframe', '1min')
    user_id = get_jwt_identity()

    # Check if cached data exists for this pair
    cached_signals = redis_conn.get(f"signals_{pair}_{interval}")
    if cached_signals:
        return jsonify({'signals': cached_signals.decode('utf-8')})

    # Fetch indicators from Alpha Vantage
    atr_data = fetch_indicator(pair, 'ATR', interval)
    rsi_data = fetch_indicator(pair, 'RSI', interval)
    macd_data = fetch_indicator(pair, 'MACD', interval)
    stoch_data = fetch_indicator(pair, 'STOCH', interval)

    if atr_data and rsi_data and macd_data and stoch_data:
        signals = calculate_signals(atr_data, rsi_data, macd_data, stoch_data)
        
        # Cache the result in Redis
        redis_conn.set(f"signals_{pair}_{interval}", signals, ex=60)

        # Store signal history in the database
        signal_history = SignalHistory(
            user_id=user_id,
            pair=pair,
            timeframe=interval,
            signals=str(signals),
            timestamp=datetime.utcnow()
        )
        db.session.add(signal_history)
        db.session.commit()

        return jsonify({'signals': signals})

    return jsonify({'error': 'Failed to fetch data from Alpha Vantage'}), 500

# Register and login routes (unchanged)

if __name__ == "__main__":
    app.run(debug=True, host='0.0.0.0', port=5000)

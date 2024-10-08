# indicators.py

import numpy as np

def calculate_atr(candles):
    high_prices = np.array([candle['high'] for candle in candles])
    low_prices = np.array([candle['low'] for candle in candles])
    close_prices = np.array([candle['close'] for candle in candles])

    tr = np.maximum(high_prices - low_prices, abs(high_prices - close_prices[:-1]), abs(low_prices - close_prices[:-1]))
    atr = np.mean(tr[-14:])
    return atr

def calculate_rsi(candles):
    close_prices = np.array([candle['close'] for candle in candles])
    delta = np.diff(close_prices)
    
    gain = np.where(delta > 0, delta, 0)
    loss = np.where(delta < 0, -delta, 0)

    avg_gain = np.mean(gain[-14:])
    avg_loss = np.mean(loss[-14:])

    rs = avg_gain / avg_loss
    rsi = 100 - (100 / (1 + rs))
    return rsi

def calculate_macd(candles):
    close_prices = np.array([candle['close'] for candle in candles])
    
    short_ema = np.mean(close_prices[-12:])  # Short EMA (12)
    long_ema = np.mean(close_prices[-26:])   # Long EMA (26)
    
    macd = short_ema - long_ema
    signal_line = np.mean(close_prices[-9:])  # Signal line (9)
    
    return macd, signal_line

def calculate_stochastics(candles):
    high_prices = np.array([candle['high'] for candle in candles])
    low_prices = np.array([candle['low'] for candle in candles])
    close_prices = np.array([candle['close'] for candle in candles])
    
    highest_high = np.max(high_prices[-14:])
    lowest_low = np.min(low_prices[-14:])
    
    k = (close_prices[-1] - lowest_low) / (highest_high - lowest_low) * 100
    d = np.mean(k[-3:])
    
    return k, d

def calculate_signals(candles):
    atr = calculate_atr(candles)
    rsi = calculate_rsi(candles)
    macd, signal_line = calculate_macd(candles)
    k, d = calculate_stochastics(candles)

    signals = {
        'ATR': atr,
        'RSI': rsi,
        'MACD': macd,
        'Signal Line': signal_line,
        'Stochastic K': k,
        'Stochastic D': d,
    }

    return signals

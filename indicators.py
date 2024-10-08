# indicators.py

def extract_last_value(data, key):
    """
    Extract the last value from the indicator JSON response.
    """
    time_series = list(data.values())[1]  # The indicator values are in the second key
    latest_timestamp = sorted(time_series.keys())[-1]  # Get the most recent timestamp
    return time_series[latest_timestamp][key]

def calculate_atr(atr_data):
    """
    Extract ATR (Average True Range) value from Alpha Vantage response.
    """
    return extract_last_value(atr_data, 'ATR')

def calculate_rsi(rsi_data):
    """
    Extract RSI (Relative Strength Index) value from Alpha Vantage response.
    """
    return extract_last_value(rsi_data, 'RSI')

def calculate_macd(macd_data):
    """
    Extract MACD (Moving Average Convergence Divergence) values from Alpha Vantage response.
    """
    macd = extract_last_value(macd_data, 'MACD')
    signal = extract_last_value(macd_data, 'MACD_Signal')
    return macd, signal

def calculate_stochastics(stoch_data):
    """
    Extract Stochastic values from Alpha Vantage response.
    """
    k = extract_last_value(stoch_data, 'SlowK')
    d = extract_last_value(stoch_data, 'SlowD')
    return k, d

def calculate_signals(atr_data, rsi_data, macd_data, stoch_data):
    """
    Aggregate the various technical indicators into a signal.
    """
    atr = calculate_atr(atr_data)
    rsi = calculate_rsi(rsi_data)
    macd, signal_line = calculate_macd(macd_data)
    k, d = calculate_stochastics(stoch_data)

    return {
        'ATR': atr,
        'RSI': rsi,
        'MACD': macd,
        'Signal Line': signal_line,
        'Stochastic K': k,
        'Stochastic D': d,
    }

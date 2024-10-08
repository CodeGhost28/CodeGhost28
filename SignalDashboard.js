// src/components/SignalDashboard.js

import React, { useEffect, useState } from 'react';
import axios from 'axios';

const SignalDashboard = ({ token }) => {
  const [signals, setSignals] = useState({});
  const [pair, setPair] = useState('EURUSD');  // Alpha Vantage uses no slash
  const [timeframe, setTimeframe] = useState('1min');

  useEffect(() => {
    const fetchSignals = async () => {
      try {
        const response = await axios.get(`http://localhost:5000/api/signals`, {
          params: { pair, timeframe },
          headers: { Authorization: `Bearer ${token}` },  // Pass the JWT token
        });
        setSignals(response.data.signals);
      } catch (error) {
        console.error('Error fetching signals:', error);
      }
    };

    fetchSignals();
  }, [pair, timeframe, token]);

  return (
    <div className="signal-dashboard">
      <h1>Trading Signals for {pair}</h1>
      <div>
        <label>Pair: </label>
        <select value={pair} onChange={(e) => setPair(e.target.value)}>
          <option value="EURUSD">EURUSD</option>
          <option value="MSFT">MSFT</option>
          <option value="AAPL">AAPL</option>
        </select>

        <label>Timeframe: </label>
        <select value={timeframe} onChange={(e) => setTimeframe(e.target.value)}>
          <option value="1min">1 Minute</option>
          <option value="5min">5 Minutes</option>
          <option value="15min">15 Minutes</option>
        </select>
      </div>

      <div className="signals">
        <h3>ATR: {signals.ATR}</h3>
        <h3>RSI: {signals.RSI}</h3>
        <h3>MACD: {signals.MACD}</h3>
        <h3>Signal Line: {signals['Signal Line']}</h3>
        <h3>Stochastic K: {signals['Stochastic K']}</h3>
        <h3>Stochastic D: {signals['Stochastic D']}</h3>
      </div>
    </div>
  );
};

export default SignalDashboard;

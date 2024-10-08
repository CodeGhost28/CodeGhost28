// src/components/SignalDashboard.js

import React, { useEffect, useState } from 'react';
import axios from 'axios';

const SignalDashboard = () => {
  const [signals, setSignals] = useState({});
  const [pair, setPair] = useState('EUR/USD');
  const [timeframe, setTimeframe] = useState('M1');

  useEffect(() => {
    const fetchSignals = async () => {
      try {
        const response = await axios.get(`http://localhost:5000/api/signals`, {
          params: {
            pair,
            timeframe,
          },
        });
        setSignals(response.data.signals);
      } catch (error) {
        console.error('Error fetching signals:', error);
      }
    };

    fetchSignals();
  }, [pair, timeframe]);

  return (
    <div className="signal-dashboard">
      <h1>Trading Signals for {pair}</h1>
      <div>
        <label>Pair: </label>
        <select value={pair} onChange={(e) => setPair(e.target.value)}>
          <option value="EUR/USD">EUR/USD</option>
          <option value="Boom">Boom</option>
          <option value="Crash">Crash</option>
          <option value="Step Index">Step Index</option>
        </select>

        <label>Timeframe: </label>
        <select value={timeframe} onChange={(e) => setTimeframe(e.target.value)}>
          <option value="M1">M1</option>
          <option value="M5">M5</option>
          <option value="H1">H1</option>
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
import React, { useEffect, useState } from 'react';
import axios from 'axios';

const SignalDashboard = ({ token }) => {
  const [signals, setSignals] = useState({});
  const [pair, setPair] = useState('EUR/USD');
  const [timeframe, setTimeframe] = useState('M1');

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
          <option value="EUR/USD">EUR/USD</option>
          <option value="Boom">Boom</option>
          <option value="Crash">Crash</option>
          <option value="Step Index">Step Index</option>
        </select>

        <label>Timeframe: </label>
        <select value={timeframe} onChange={(e) => setTimeframe(e.target.value)}>
          <option value="M1">M1</option>
          <option value="M5">M5</option>
          <option value="H1">H1</option>
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

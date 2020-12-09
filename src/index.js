import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import App from './components/App';

ReactDOM.render(
  <React.StrictMode>
    <div id="chart"></div>
    <App />
  </React.StrictMode>,
  document.getElementById('root')
);

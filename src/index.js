// src/index.js

import React from 'react';
import ReactDOM from 'react-dom/client';
import { Amplify } from 'aws-amplify';
import awsconfig from './aws-exports';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';

import 'slick-carousel/slick/slick.css';
import 'slick-carousel/slick/slick-theme.css';

// Determine if we're running locally
const isLocal =
  window.location.hostname === 'localhost' ||
  window.location.hostname === '127.0.0.1';

if (isLocal) {
  // Override only the API endpoint for local development
  Amplify.configure({
    ...awsconfig,
    aws_cloud_logic_custom: [
      {
        name: 'aiPlatformApiDev',
        endpoint: 'http://127.0.0.1:5000',
        region: 'us-east-1',
      },
    ],
  });
} else {
  // Use the real AWS configuration in production
  Amplify.configure(awsconfig);
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// If you want to start measuring performance in your app,
// pass a function to log results (for example: reportWebVitals(console.log))
reportWebVitals();

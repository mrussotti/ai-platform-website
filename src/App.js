import React from 'react';
import './App.css';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Team from './pages/Team';
import Projects from './pages/Projects';
import ML_Predictions from './pages/ML_Predictions';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';

import { Amplify } from 'aws-amplify';
import awsconfig from './aws-exports';
Amplify.configure(awsconfig);


function App() {
  return (
    <Router>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/team" element={<Team />} />
        <Route path="/projects" element={<Projects />} />
        <Route path="/ML_Predictions" element={<ML_Predictions />} />
      </Routes>
    </Router>
  );
}

export default App;

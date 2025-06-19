import React from 'react';
import './App.css';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import About from './pages/About';
import Projects from './pages/Projects';
import ML_Predictions from './pages/ML_Predictions';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import GraphVisualise from './pages/GraphVisualise';
import { QueryProvider } from './contexts/QueryContext';

import { Amplify } from 'aws-amplify';
import awsconfig from './aws-exports';
Amplify.configure(awsconfig);


function App() {
  return (
    // <QueryProvider>
      <Router>
        <Navbar />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/About" element={<About />} />
          <Route path="/projects" element={<Projects />} />
          {/* <Route path="/graphvisualise" element= {<GraphVisualise />} /> */}
        </Routes>
      </Router>
  );
}

export default App;

import React from 'react';
import './App.css';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Team from './pages/Team';
import Projects from './pages/Projects';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import GraphVisualise from './pages/GraphVisualise';
import { QueryProvider } from './contexts/QueryContext';

import { Amplify } from 'aws-amplify';
import awsconfig from './aws-exports';
Amplify.configure(awsconfig);


function App() {
  return (
    <QueryProvider>
      <Router>
        <Navbar />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/team" element={<Team />} />
          <Route path="/projects" element={<Projects />} />
          <Route path="/graphvisualise" element= {<GraphVisualise />} />
        </Routes>
      </Router>
    </QueryProvider>
  );
}

export default App;

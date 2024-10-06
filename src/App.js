import React from 'react';
import './App.css';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Team from './pages/Team';
import Projects from './pages/Projects';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import GraphQuery from './components/GraphQuery';

function App() {
  return (
    <Router>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/team" element={<Team />} />
        <Route path="/projects" element={<Projects />} />
        <Route path="/querypage" element={<GraphQuery />} />
      </Routes>
    </Router>
  );
}

export default App;

//some queries to test
// 1. match (n) where n.age is NOT NULL return distinct "node" as entity, n.age as age limit 25 union all match ()-[r]-() where r.age is not null RETURN DISTINCT "relationship" AS entity, r.age AS age LIMIT 25;
// 2. MATCH p=()-[:CONTAINS]->() RETURN p LIMIT 5;
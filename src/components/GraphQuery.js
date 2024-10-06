import React, { useState } from 'react';
import axios from 'axios';
const PORT = 5001;
const GraphQuery = () => {
  const [query, setQuery] = useState('');
  const [result, setResult] = useState([]);

  // Function to handle form submission
  const handleSubmit = async (event) => {
    event.preventDefault();
    try {
        const response = await axios.post(`http://localhost:${PORT}/api/run-cypher`, {
        query: query,
      });
      setResult(response.data);
    } catch (error) {
      console.error('Error executing Cypher query:', error);
    }
  };

  // Function to render data dynamically
  const renderResult = () => {
    if (result.length === 0) return <p className=' text-white' >No Results to Display</p>;

    return result.map((record, index) => (
      <div className=' text-white'  key={index} style={{ border: '1px solid #ddd', padding: '10px', marginBottom: '10px' }}>
        {Object.keys(record).map((key, i) => {
          const value = record[key];
          return (
            <div key={i}>
              <strong>{key}:</strong> {renderValue(value)}
            </div>
          );
        })}
      </div>
    ));
  };

  // Helper function to render nodes, relationships, or paths
  const renderValue = (value) => {
    if (!value) {
      // If the value is null or undefined, return a fallback message
      return <span>Value is null or undefined</span>;
    }
    if (value.labels) {
      // If value has labels, it's a Node
      return (
        <div className=' text-white' >
          <strong>Node Labels:</strong> {value.labels.join(', ')}
          <br />
          <strong>Properties:</strong> {JSON.stringify(value.properties, null, 2)}
        </div>
      );
    } else if (value.type) {
      // If value has type, it's a Relationship
      return (
        <div className=' text-white' >
          <strong>Relationship Type:</strong> {value.type}
          <br />
          <strong>Start Node:</strong> {value.start}
          <br />
          <strong>End Node:</strong> {value.end}
          <br />
          <strong>Properties:</strong> {JSON.stringify(value.properties, null, 2)}
        </div>
      );
    } else if (value.segments) {
      // If value has segments, it's a Path
      return (
        <div className=' text-white' >
          <strong>Path:</strong>
          {value.segments.map((segment, index) => (
            <div key={index}>
              <em>Start Node:</em> {JSON.stringify(segment.start.properties, null, 2)} <br />
              <em>Relationship:</em> {segment.relationship.type} <br />
              <em>End Node:</em> {JSON.stringify(segment.end.properties, null, 2)} <br />
            </div>
          ))}
        </div>
      );
    } else {
      // Fallback to rendering value as string
      return <pre className=' text-white' >{JSON.stringify(value, null, 2)}</pre>;
    }
  };

  return (
    <div className=' text-white flex flex-col items-center' >
      <h1 className=' font-extrabold text-6xl text-white p-8 ' >Graph Query Interface</h1>
      <form className=' w-full flex flex-col items-center ' onSubmit={handleSubmit}>
        <label className=' w-3/4 text-white' >
          <div className=' font-medium text-xl mb-4' >Enter Cypher Query:</div>
          <textarea
            className=' text-black bg-white rounded-xl p-2'
            style={{ width: '100%', height: '100px' }}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="MATCH (n) RETURN n LIMIT 10"
          />
        </label>
        <br />
        <button className=' bg-blue-500 py-3 px-4 hover:bg-blue-400 font-medium text-white rounded-xl ' type="submit">Run Query</button>
      </form>

      {/* Display Query Results */}
      <h2 className=' my-2 text-white' >Results:</h2>
      {renderResult()}
    </div>
  );
};

export default GraphQuery;
import React, { useState, useEffect } from 'react';
import DataDisplay from './DataDisplay';

export default function DataFetcher({ dbname }) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [customQuery, setCustomQuery] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!customQuery.trim()) {
      alert('Please enter a query.');
      return;
    }
    setIsSubmitting(true);
    fetchData(customQuery);
  };

  const fetchData = (query = null) => {
    setLoading(true);
    setError(null);

    const apiUrl = `https://gjz0zq3tyd.execute-api.us-east-1.amazonaws.com/dev/neo4j/${dbname}`;

    const fetchOptions = query
      ? {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ query }),
        }
      : {
          method: 'GET',
        };

    fetch(apiUrl, fetchOptions)
      .then((response) => {
        console.log('Response status:', response.status);
        console.log('Response status text:', response.statusText);
        if (!response.ok) {
          return response.json().then((errorData) => {
            throw new Error(
              `Network response was not ok: ${response.status} - ${errorData.error || response.statusText}`
            );
          });
        }
        return response.json();
      })
      .then((data) => {
        setData(data);
        setLoading(false);
        setIsSubmitting(false);
      })
      .catch((error) => {
        console.error('Error fetching data:', error);
        setError(error);
        setLoading(false);
        setIsSubmitting(false);
      });
  };

  useEffect(() => {
    fetchData();
  }, [dbname]);

  return (
    <div>
      {/* Query Input Form */}
      <form onSubmit={handleSubmit} style={{ marginBottom: '20px' }}>
        <label>
          Enter Custom Query:
          <input
            type="text"
            value={customQuery}
            onChange={(e) => setCustomQuery(e.target.value)}
            placeholder="e.g., MATCH (n) RETURN n LIMIT 5"
            style={{ marginLeft: '10px', width: '60%' }}
          />
        </label>
        <button type="submit" disabled={isSubmitting} style={{ marginLeft: '10px' }}>
          {isSubmitting ? 'Submitting...' : 'Submit'}
        </button>
      </form>

      {/* Display Loading, Error, or Data */}
      {loading ? (
        <p>Loading data...</p>
      ) : error ? (
        <p>Error fetching data: {error.message}</p>
      ) : (
        <DataDisplay data={data} />
      )}
    </div>
  );
}

// DataFetcher.js

import React, { useState, useEffect } from 'react';
import DataDisplay from './DataDisplay';
import styles from './css/DataFetcher.module.css';

export default function DataFetcher({ dbname }) {
  const [data, setData] = useState(null); 
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [customQuery, setCustomQuery] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const presetQueries = [
    {
      label: 'Fetch 5 Nodes',
      query: 'MATCH (n) RETURN n LIMIT 5',
    },
    {
      label: 'Create a Node',
      query: "CREATE (n:Person {name: 'New Person'}) RETURN n",
    },
    {
      label: 'Delete a Node',
      query: "MATCH (n {name: 'New Person'}) DELETE n",
    },    
  ];

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!customQuery.trim()) {
      alert('Please enter a query.');
      return;
    }
    setIsSubmitting(true);
    fetchData(customQuery);
  };

  const handlePresetClick = (query) => {
    setCustomQuery(query);
    setError(null); 
  };

  const handleReset = () => {
    setCustomQuery('');
    setIsSubmitting(false);
    fetchData(); // Fetch default data
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

  const handleExport = () => {
    setLoading(true);
    setError(null);

    const apiUrl = `https://gjz0zq3tyd.execute-api.us-east-1.amazonaws.com/dev/neo4j/${dbname}?export=csv`;

    fetch(apiUrl)
      .then((response) => {
        if (!response.ok) {
          return response.text().then((errorText) => {
            throw new Error(`Error: ${response.status} - ${errorText}`);
          });
        }
        return response.text().then((csvData) => {
          setLoading(false);
          // Create a Blob from the CSV data
          const blob = new Blob([csvData], { type: 'text/csv' });
          const url = window.URL.createObjectURL(blob);
          // Create a link to download the CSV file
          const link = document.createElement('a');
          link.href = url;
          link.setAttribute('download', 'graph_export.csv');
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        });
      })
      .catch((error) => {
        console.error('Error exporting data:', error);
        setError(error);
        setLoading(false);
      });
  };

  return (
    <div className={styles.dataFetcherContainer}>
      {/* Query Input Form */}
      <form onSubmit={handleSubmit} className={styles.form}>
        <label htmlFor="customQuery" className={styles.label}>
          Enter Custom Query:
        </label>
        <input
          type="text"
          id="customQuery"
          value={customQuery}
          onChange={(e) => setCustomQuery(e.target.value)}
          placeholder="e.g., MATCH (n) RETURN n LIMIT 5"
          className={styles.input}
        />
        <div className={styles.buttonContainer}>
          <button type="submit" disabled={isSubmitting} className={styles.button}>
            {isSubmitting ? 'Submitting...' : 'Submit'}
          </button>
          <button type="button" onClick={handleReset} className={styles.resetButton}>
            Reset to Default
          </button>
        </div>
      </form>

      {/* Preset Query Buttons and Export Button */}
      <div className={styles.presetContainer}>
        {presetQueries.map((preset, index) => (
          <button
            key={index}
            type="button"
            className={styles.presetButton}
            onClick={() => handlePresetClick(preset.query)}
          >
            {preset.label}
          </button>
        ))}

        {/* Export Button */}
        <button
          type="button"
          className={styles.exportButton}
          onClick={handleExport}
          disabled={loading}
        >
          {loading ? 'Exporting...' : 'Download CSV'}
        </button>
      </div>

      {/* Display Loading, Error, or Data */}
      {loading ? (
        <p>Loading data...</p>
      ) : error ? (
        <p className={styles.errorMessage}>Error: {error.message}</p>
      ) : (
        <DataDisplay data={data} />
      )}
    </div>
  );
}

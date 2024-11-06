import React, { useState, useEffect } from 'react';
import DataDisplay from './DataDisplay';
import styles from './css/DataFetcher.module.css';
import { OpenAI } from 'openai';


export default function DataFetcher({ dbname }) {
  const [data, setData] = useState(null); 
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [customQuery, setCustomQuery] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const [naturalLanguageQuery, setNaturalLanguageQuery] = useState(''); // New state for user input in natural language
  const [isTranslating, setIsTranslating] = useState(false); // Track translation state


  

  const openai = new OpenAI({
    apiKey: process.env.REACT_APP_OPENAI_API_KEY,
    dangerouslyAllowBrowser: true
  });

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

  // Translate natural language query to Cypher
  const translateQuery = async (naturalQuery) => {
    try {
      setIsTranslating(true);
      const response = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "user",
            content: `Convert the following natural language request into a Cypher query for a Neo4j database:\n\n"${naturalQuery}"`
          }
        ],
        max_tokens: 100,
      });

      console.log("API Response:", response); 
  
      const generatedQuery = response.choices?.[0]?.message?.content?.trim();

      
      if (generatedQuery) {
        setCustomQuery(generatedQuery);
        fetchData(generatedQuery); // Automatically fetch data with the translated query
      } else {
        throw new Error("Failed to generate query.");
      }
    } catch (error) {
      console.error("Error translating query:", error);
      setError(error);
    } finally {
      setIsTranslating(false);
    }
  };
  

  const handleNaturalQuerySubmit = (e) => {
    e.preventDefault();
    if (!naturalLanguageQuery.trim()) {
      alert('Please enter a query.');
      return;
    }
    translateQuery(naturalLanguageQuery); // Translate natural language input
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
    setIsExporting(true);
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
          const blob = new Blob([csvData], { type: 'text/csv' });
          const url = window.URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.setAttribute('download', 'graph_export.csv');
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          setIsExporting(false);
        });
      })
      .catch((error) => {
        console.error('Error exporting data:', error);
        setError(error);
        setIsExporting(false);
      });
  };

  

  return (
    <div className={styles.dataFetcherContainer}>

      {/* Natural Language Query Form */}
      <form onSubmit={handleNaturalQuerySubmit} className={styles.form}>
        <label htmlFor="naturalQuery" className={styles.label}>
          Enter Request in Natural Language:
        </label>
        <input
          id="naturalQuery"
          value={naturalLanguageQuery}
          onChange={(e) => setNaturalLanguageQuery(e.target.value)}
          placeholder="e.g., Show me 5 nodes"
          className={styles.input}
        />
        <button type="submit" disabled={isTranslating} className={styles.button}>
          {isTranslating ? 'Translating...' : 'Translate & Submit'}
        </button>
      </form>

      {/* Query Input Form */}
      <form onSubmit={(e) => { e.preventDefault(); fetchData(customQuery); }} className={styles.form}>
        <label htmlFor="customQuery" className={styles.label}>
          Enter Custom Cypher Query:
        </label>
        <textarea
          id="customQuery"
          value={customQuery}
          onChange={(e) => setCustomQuery(e.target.value)}
          placeholder="e.g., MATCH (n) RETURN n LIMIT 5"
          className={styles.input}
          rows={4}
        />
        <button type="submit" disabled={isSubmitting} className={styles.button}>
          {isSubmitting ? 'Submitting...' : 'Submit'}
        </button>
        <button type="button" onClick={handleExport} disabled={isExporting} className={styles.exportButton}>
          {isExporting ? 'Exporting...' : 'Download CSV'}
        </button>
        <button type="button" onClick={handleReset} className={styles.resetButton}>
          Reset to Default
        </button>
      </form>

      {/* Preset Query Buttons */}
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
      </div>

      {/* Display Loading, Error, or Data */}
      {loading ? (
        <p>Loading data from {dbname}...</p>
      ) : error ? (
        <p className={styles.errorMessage}>Error: {error.message}</p>
      ) : (
        <DataDisplay data={data} />
      )}
    </div>
  );
}

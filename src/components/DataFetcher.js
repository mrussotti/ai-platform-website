import React, { useState, useEffect } from 'react';
import { API } from 'aws-amplify';
import DataDisplay from './DataDisplay';
import styles from './css/DataFetcher.module.css';

// This component fetches data from the configured Amplify API endpoint.
// `dbname` is the database name you pass as a prop and will be appended to the path.

export default function DataFetcher({ dbname }) {
  const [data, setData] = useState(null); 
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [customQuery, setCustomQuery] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  // The API name is found in aws-exports.js `aws_cloud_logic_custom` array.
  // For example, if aws-exports.js has:
  // "aws_cloud_logic_custom": [
  //   { "name": "aiplatformapi", "endpoint": "https://xxxx.execute-api.us-east-1.amazonaws.com/dev" }
  // ]
  // then use "aiplatformapi" here.
  const apiName = 'aiplatformapi'; 
  const path = `/neo4j/${dbname}`;

  const presetQueries = [
    { label: 'Fetch 5 Nodes', query: 'MATCH (n) RETURN n LIMIT 5' },
    { label: 'Create a Node', query: "CREATE (n:Person {name: 'New Person'}) RETURN n" },
    { label: 'Delete a Node', query: "MATCH (n {name: 'New Person'}) DELETE n" },
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
    fetchData(); // Fetch default data again
  };

  const handleGraphVisualisation = () => {
    if (!customQuery){
      alert('Please enter a query.');
      return;
    }
    const graphUrl = new URL('viewgraph.html',window.location.origin);
    graphUrl.searchParams.append('dbname', dbname);
    graphUrl.searchParams.append('query', customQuery);
    window.open(graphUrl.toString(), '_blank', 'width=800,height=600');
  }

  const fetchData = (query = null) => {
    setLoading(true);
    setError(null);
    try {
      let responseData;
      if (query) {
        // POST request for custom query
        responseData = await API.post(apiName, path, {
          body: { query },
          headers: { 'Content-Type': 'application/json' },
        });
      } else {
        // GET request for default data
        responseData = await API.get(apiName, path, {});
      }
      setData(responseData);
    } catch (err) {
      console.error('Error fetching data:', err);
      setError(err);
    } finally {
      setLoading(false);
      setIsSubmitting(false);
    }
  };

  // useEffect(() => {
  //   fetchData();
  // }, [dbname]);

  const handleExport = async () => {
    setIsExporting(true);
    setError(null);

    try {
      // Get the endpoint from aws-exports.js (already configured by Amplify)
      // and build the CSV export URL with `?export=csv`.
      const { aws_cloud_logic_custom } = (await import('../aws-exports')); // adjust path as needed
      const endpointInfo = aws_cloud_logic_custom.find(api => api.name === apiName);
      const exportUrl = `${endpointInfo.endpoint}${path}?export=csv`;

      const response = await fetch(exportUrl);
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Error exporting data: ${response.status} - ${errorText}`);
      }

      const csvData = await response.text();
      const blob = new Blob([csvData], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'graph_export.csv');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error('Error exporting data:', err);
      setError(err);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className={styles.dataFetcherContainer}>
      <form onSubmit={handleSubmit} className={styles.form}>
        <label htmlFor="customQuery" className={styles.label}>Enter Custom Query:</label>
        <textarea
          id="customQuery"
          value={customQuery}
          onChange={(e) => setCustomQuery(e.target.value)}
          placeholder="e.g., MATCH (n) RETURN n LIMIT 5"
          className={styles.input}
          rows={4}
        />
        <div className={styles.buttonContainer}>
          <button type="submit" disabled={isSubmitting} className={styles.button}>
            {isSubmitting ? 'Submitting...' : 'Submit'}
          </button>
          <button
            type="button"
            className={styles.exportButton}
            onClick={handleExport}
            disabled={isExporting}
          >
            {isExporting ? 'Exporting...' : 'Download CSV'}
          </button>
          <button type="button" onClick={handleReset} className={styles.resetButton}>
            Reset to Default
          </button>
          <button type="button" onClick={handleGraphVisualisation} className={styles.visualiseGraphButton}>
            Visualize Graph
          </button>
        </div>
      </form>

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

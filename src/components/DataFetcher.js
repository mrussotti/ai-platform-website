// src/components/DataFetcher.js

import React, { useState, useRef } from 'react';
import { API } from 'aws-amplify';
import Papa from 'papaparse';
import DataDisplay from './DataDisplay';
import styles from './css/DataFetcher.module.css';

const apiName = 'aiPlatformApiDev'; // or 'aiPlatformApiProd'
export default function DataFetcher({ dbname }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [customQuery, setCustomQuery] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const fileInputRef = useRef(null);

  const path = `/neo4j/${dbname}`;
  const batchPath = '/process_all_transcripts';

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
    fetchData();
  };

  const handleGraphVisualisation = () => {
    if (!customQuery.trim()) {
      alert('Please enter a query.');
      return;
    }
    const graphUrl = new URL('viewgraph.html', window.location.origin);
    graphUrl.searchParams.append('dbname', dbname);
    graphUrl.searchParams.append('query', customQuery);
    window.open(graphUrl.toString(), '_blank', 'width=800,height=600');
  };

  // New: parse CSV and send batch of 911 records
  const handleBatchUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setLoading(true);
    setError(null);

    file.text()
      .then(text =>
        new Promise((resolve) =>
          Papa.parse(text, {
            header: true,
            skipEmptyLines: true,
            complete: results => resolve(results.data),
          })
        )
      )
      .then(async (rows) => {
        const response = await API.post(apiName, batchPath, {
          body: rows,
          headers: { 'Content-Type': 'application/json' },
        });
        setData(response);
      })
      .catch(err => {
        console.error('Batch upload error:', err);
        setError(err);
      })
      .finally(() => {
        setLoading(false);
        // reset file input
        if (fileInputRef.current) fileInputRef.current.value = '';
      });
  };

  const fetchData = async (query = null) => {
    setLoading(true);
    setError(null);
    try {
      const responseData = query
        ? await API.post(apiName, path, { body: { query }, headers: { 'Content-Type': 'application/json' } })
        : await API.get(apiName, path, {});
      setData(responseData);
    } catch (err) {
      console.error('Error fetching data:', err);
      setError(err);
    } finally {
      setLoading(false);
      setIsSubmitting(false);
    }
  };

  const handleExport = async () => {
    setIsExporting(true);
    setError(null);
    try {
      const { default: awsconfig } = await import('../aws-exports');
      const endpointInfo = awsconfig.aws_cloud_logic_custom.find(api => api.name === apiName);
      if (!endpointInfo) throw new Error('API endpoint not found in aws-exports.js');
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

      {/* Hidden file input for batch upload */}
      <input
        type="file"
        accept=".csv"
        ref={fileInputRef}
        onChange={handleBatchUpload}
        style={{ display: 'none' }}
      />

      <form onSubmit={handleSubmit} className={styles.form}>
        {/* existing query form */}
        <label htmlFor="customQuery" className={styles.label}>
          Enter Custom Query:
        </label>
        <textarea
          id="customQuery"
          value={customQuery}
          onChange={e => setCustomQuery(e.target.value)}
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
          <button
            type="button"
            onClick={handleGraphVisualisation}
            className={styles.visualiseGraphButton}
          >
            Visualize Graph
          </button>
          {/* Updated Add 911 Record button */}
          <button
            type="button"
            onClick={() => fileInputRef.current && fileInputRef.current.click()}
            className={styles.addNodeButton}
          >
            Upload 911 Spreadsheet
          </button>
        </div>
      </form>

      {/* Keep DataDisplay and error/loading */}
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

// src/components/DataFetcher.js

import React, { useState, useRef } from 'react';
import { API } from 'aws-amplify';
import Papa from 'papaparse';
import DataDisplay from './DataDisplay';
import styles from './css/DataFetcher.module.css';
import { useQuery } from '../contexts/QueryContext';
import { useNavigate } from 'react-router-dom';

const apiName = 'aiPlatformApiDev';

export default function DataFetcher({ dbname }) {
  const [data, setData] = useState(null);
  const [status, setStatus] = useState('idle');         // 'idle' | 'loading' | 'success' | 'error'
  const [statusMessage, setStatusMessage] = useState('');
  const [customQuery, setCustomQuery] = useState('');
  const [isExporting, setIsExporting] = useState(false);
  const fileInputRef = useRef(null);

  const path = `/neo4j/${dbname}`;
  const batchPath = '/process_all_transcripts';

  // Common flag for disabling controls while busy
  const busy = status === 'loading';

  // ---- Batch upload ----
  const handleBatchUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setStatus('loading');
    setStatusMessage('Uploading & processing spreadsheet…');

    file.text()
      .then((text) =>
        new Promise((resolve) =>
          Papa.parse(text, {
            header: true,
            skipEmptyLines: true,
            complete: (results) => resolve(results.data),
          })
        )
      )
      .then(async (rows) => {
        try {
          const response = await API.post(apiName, batchPath, {
            body: rows,
            headers: { 'Content-Type': 'application/json' },
          });
          setData(response);
          setStatus('success');
          setStatusMessage(`Processed ${rows.length} records successfully.`);
        } catch (err) {
          console.error('Batch upload error:', err);
          setStatus('error');
          setStatusMessage(err.message || 'Batch upload failed.');
        }
      })
      .catch((err) => {
        console.error('Parsing error:', err);
        setStatus('error');
        setStatusMessage('Failed to parse CSV.');
      })
      .finally(() => {
        if (fileInputRef.current) fileInputRef.current.value = '';
      });
  };

  // ---- Cypher query ----
  const fetchData = async (query = null) => {
    setStatus('loading');
    setStatusMessage('Running query…');
    try {
      const responseData = query
        ? await API.post(apiName, path, {
            body: { query },
            headers: { 'Content-Type': 'application/json' },
          })
        : await API.get(apiName, path, {});
      setData(responseData);
      setStatus('success');
      setStatusMessage('Query succeeded.');
    } catch (err) {
      console.error('Error fetching data:', err);
      setStatus('error');
      setStatusMessage(err.message || 'Query failed.');
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!customQuery.trim()) return alert('Please enter a query.');
    fetchData(customQuery);
  };

  const handlePresetClick = (query) => {
    setCustomQuery(query);
    setStatus('idle');
    setStatusMessage('');
  };

  const handleReset = () => {
    setCustomQuery('');
    setStatus('idle');
    setStatusMessage('');
    fetchData();
  };

  const handleGraphVisualisation = () => {
    if (!customQuery.trim()) return alert('Please enter a query.');
    const graphUrl = new URL('viewgraph.html', window.location.origin);
    graphUrl.searchParams.append('dbname', dbname);
    graphUrl.searchParams.append('query', customQuery);
    window.open(graphUrl.toString(), '_blank', 'width=800,height=600');
  };

  // ---- CSV Export ----
  const handleExport = async () => {
    setStatus('loading');
    setStatusMessage('Exporting CSV…');
    setIsExporting(true);
    try {
      const { default: awsconfig } = await import('../aws-exports');
      const endpointInfo = awsconfig.aws_cloud_logic_custom.find((api) => api.name === apiName);
      if (!endpointInfo) throw new Error('API endpoint not found in aws-exports.js');
      const exportUrl = `${endpointInfo.endpoint}${path}?export=csv`;
      const response = await fetch(exportUrl);
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Export failed: ${response.status} - ${errorText}`);
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
      setStatus('success');
      setStatusMessage('CSV export ready.');
    } catch (err) {
      console.error('Error exporting data:', err);
      setStatus('error');
      setStatusMessage(err.message || 'Export failed.');
    } finally {
      setIsExporting(false);
    }
  };

  // ---- Template Download ----
  const handleTemplateDownload = () => {
    const link = document.createElement('a');
    link.href = '/911_Template_With_Example.csv';   // served from public/
    link.download = '911_Template_With_Example.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className={styles.dataFetcherContainer}>
      {/* Hidden file input */}
      <input
        type="file"
        accept=".csv"
        ref={fileInputRef}
        onChange={handleBatchUpload}
        style={{ display: 'none' }}
      />

      <form onSubmit={handleSubmit} className={styles.form}>
        <label htmlFor="customQuery" className={styles.label}>
          Enter Custom Query:
        </label>
        <textarea
          id="customQuery"
          value={customQuery}
          onChange={(e) => setCustomQuery(e.target.value)}
          placeholder="e.g., MATCH (n) RETURN n LIMIT 5"
          className={styles.input}
          rows={4}
          disabled={busy}
        />
        <div className={styles.buttonContainer}>
          <button type="submit" className={styles.button} disabled={busy}>
            {busy ? 'Working…' : 'Submit'}
          </button>
          <button
            type="button"
            className={styles.exportButton}
            onClick={handleExport}
            disabled={busy || isExporting}
          >
            {busy && isExporting ? 'Exporting…' : 'Download CSV'}
          </button>
          <button
            type="button"
            onClick={handleReset}
            className={styles.resetButton}
            disabled={busy}
          >
            Reset to Default
          </button>
          <button
            type="button"
            onClick={handleGraphVisualisation}
            className={styles.visualiseGraphButton}
            disabled={busy}
          >
            Visualize Graph
          </button>
          <button
            type="button"
            onClick={handleTemplateDownload}
            className={styles.resetButton}
            disabled={busy}
          >
            Download 911 Template
          </button>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className={styles.addNodeButton}
            disabled={busy}
          >
            {busy ? 'Uploading…' : 'Upload 911 Spreadsheet'}
          </button>
        </div>
      </form>

      {/* Status banner */}
      {status !== 'idle' && (
        <p
          className={
            status === 'loading'
              ? styles.infoMessage
              : status === 'error'
              ? styles.errorMessage
              : styles.successMessage
          }
        >
          {statusMessage}
        </p>
      )}

      {/* Data display */}
      {status === 'success' && data && <DataDisplay data={data} />}
    </div>
  );
}

import React, { useState } from 'react';
import { API } from 'aws-amplify'; 
import DataDisplay from './DataDisplay';
import styles from './css/DataFetcher.module.css';

const apiName = 'aiPlatformApiDev'; // or 'aiPlatformApiProd' for production

export default function DataFetcher({ dbname }) {
  const [data, setData] = useState(null); 
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [customQuery, setCustomQuery] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  // State for modal popup (new 911 record)
  const [showModal, setShowModal] = useState(false);
  const [record, setRecord] = useState({
    incidentno: '',
    nature: '',
    start: '',
    incidentFileName: '',
    transcriptFileName: '',
    TEXT: '',
    address: '',
    clean_address_EMS: '',
    latitude_EMS: '',
    longitude_EMS: '',
    address_reverse_EMS: '',
    clean_address_extracted: '',
    created_at: '',
    updated_at: '',
    month: '',
    Date_EMS: '',
    Date_target: ''
  });

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
    if (!customQuery) {
      alert('Please enter a query.');
      return;
    }
    const graphUrl = new URL('viewgraph.html', window.location.origin);
    graphUrl.searchParams.append('dbname', dbname);
    graphUrl.searchParams.append('query', customQuery);
    window.open(graphUrl.toString(), '_blank', 'width=800,height=600');
  };

  // Build the Cypher query from the record fields and send it to the API
  const handleAddRecord = () => {
    if (!record.incidentno) {
      alert('Incident number is required.');
      return;
    }
    const query = `
CREATE (i:Incident { 
  incidentno: toInteger(${record.incidentno.trim()}), 
  nature: ${JSON.stringify(record.nature)}, 
  start: ${JSON.stringify(record.start)}, 
  fileName: ${JSON.stringify(record.incidentFileName)}
})
CREATE (t:Transcript { 
  incidentno: toInteger(${record.incidentno.trim()}), 
  fileName: ${JSON.stringify(record.transcriptFileName)}, 
  TEXT: ${JSON.stringify(record.TEXT)}
})
CREATE (l:Location { 
  incidentno: toInteger(${record.incidentno.trim()}), 
  address: ${JSON.stringify(record.address)}, 
  clean_address_EMS: ${JSON.stringify(record.clean_address_EMS)}, 
  latitude_EMS: toFloat(${record.latitude_EMS.trim() ? record.latitude_EMS.trim() : '"0"'}), 
  longitude_EMS: toFloat(${record.longitude_EMS.trim() ? record.longitude_EMS.trim() : '"0"'}), 
  address_reverse_EMS: ${JSON.stringify(record.address_reverse_EMS)}, 
  clean_address_extracted: ${JSON.stringify(record.clean_address_extracted)}
})
CREATE (tm:Time { 
  incidentno: toInteger(${record.incidentno.trim()}), 
  created_at: ${JSON.stringify(record.created_at)}, 
  updated_at: ${JSON.stringify(record.updated_at)}, 
  month: toInteger(${record.month.trim() ? record.month.trim() : '"0"'}), 
  Date_EMS: ${JSON.stringify(record.Date_EMS)}, 
  Date_target: ${JSON.stringify(record.Date_target)}
})
CREATE (i)-[:HAPPENED_AT]->(l)
CREATE (i)-[:OCCURED_ON]->(tm)
CREATE (i)-[:CONTAINS]->(t)
RETURN i, t, l, tm
`;
    console.log(query);
    setCustomQuery(query);
    setShowModal(false);
    setIsSubmitting(true);
    fetchData(query);
  };

  const fetchData = async (query = null) => {
    setLoading(true);
    setError(null);
    try {
      let responseData;
      if (query) {
        responseData = await API.post(apiName, path, {
          body: { query },
          headers: { 'Content-Type': 'application/json' },
        });
      } else {
        responseData = await API.get(apiName, path, {});
      }
      setData(responseData);
      setIsSubmitting(false);
    } catch (err) {
      console.error('Error fetching data:', err);
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    setIsExporting(true);
    setError(null);
    try {
      const { default: awsconfig } = await import('../aws-exports');
      const endpointInfo = awsconfig.aws_cloud_logic_custom.find(api => api.name === apiName);
      if (!endpointInfo) {
        throw new Error('API endpoint not found in aws-exports.js');
      }
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

  // Helper to update a field in the record
  const updateRecordField = (field, value) => {
    setRecord(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className={styles.dataFetcherContainer}>
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
          {/* Button to open modal to add a new 911 record */}
          <button type="button" onClick={() => setShowModal(true)} className={styles.addNodeButton}>
            Add 911 Record
          </button>
        </div>
      </form>

      {/* Modal Popup for Adding a New 911 Record */}
      {showModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <h3>Add New 911 Record</h3>
            <div className={styles.formGroup}>
              <h4>Incident</h4>
              <label>Incident Number:</label>
              <input
                type="text"
                value={record.incidentno}
                onChange={(e) => updateRecordField('incidentno', e.target.value)}
                placeholder="e.g., 12345"
                className={styles.input}
                required
              />
              <label>Nature:</label>
              <input
                type="text"
                value={record.nature}
                onChange={(e) => updateRecordField('nature', e.target.value)}
                placeholder="e.g., Fire, Accident"
                className={styles.input}
              />
              <label>Start:</label>
              <input
                type="text"
                value={record.start}
                onChange={(e) => updateRecordField('start', e.target.value)}
                placeholder="e.g., 2025-02-23T10:00:00"
                className={styles.input}
              />
              <label>File Name:</label>
              <input
                type="text"
                value={record.incidentFileName}
                onChange={(e) => updateRecordField('incidentFileName', e.target.value)}
                placeholder="e.g., incident_file.csv"
                className={styles.input}
              />
            </div>
            <div className={styles.formGroup}>
              <h4>Transcript</h4>
              <label>File Name:</label>
              <input
                type="text"
                value={record.transcriptFileName}
                onChange={(e) => updateRecordField('transcriptFileName', e.target.value)}
                placeholder="e.g., transcript_file.csv"
                className={styles.input}
                required
              />
              <label>Transcript Text:</label>
              <textarea
                value={record.TEXT}
                onChange={(e) => updateRecordField('TEXT', e.target.value)}
                placeholder="Enter transcript text"
                className={styles.input}
                rows={3}
                required
              />
            </div>
            <div className={styles.formGroup}>
              <h4>Location</h4>
              <label>Address:</label>
              <input
                type="text"
                value={record.address}
                onChange={(e) => updateRecordField('address', e.target.value)}
                placeholder="e.g., 123 Main St"
                className={styles.input}
              />
              <label>Clean Address EMS:</label>
              <input
                type="text"
                value={record.clean_address_EMS}
                onChange={(e) => updateRecordField('clean_address_EMS', e.target.value)}
                placeholder="e.g., 123 main street"
                className={styles.input}
              />
              <label>Latitude EMS:</label>
              <input
                type="text"
                value={record.latitude_EMS}
                onChange={(e) => updateRecordField('latitude_EMS', e.target.value)}
                placeholder="e.g., 40.7128"
                className={styles.input}
              />
              <label>Longitude EMS:</label>
              <input
                type="text"
                value={record.longitude_EMS}
                onChange={(e) => updateRecordField('longitude_EMS', e.target.value)}
                placeholder="e.g., -74.0060"
                className={styles.input}
              />
              <label>Address Reverse EMS:</label>
              <input
                type="text"
                value={record.address_reverse_EMS}
                onChange={(e) => updateRecordField('address_reverse_EMS', e.target.value)}
                placeholder="e.g., Reverse Address"
                className={styles.input}
              />
              <label>Clean Address Extracted:</label>
              <input
                type="text"
                value={record.clean_address_extracted}
                onChange={(e) => updateRecordField('clean_address_extracted', e.target.value)}
                placeholder="e.g., Clean Address"
                className={styles.input}
              />
            </div>
            <div className={styles.formGroup}>
              <h4>Time</h4>
              <label>Created At:</label>
              <input
                type="text"
                value={record.created_at}
                onChange={(e) => updateRecordField('created_at', e.target.value)}
                placeholder="e.g., 2025-02-23T10:00:00"
                className={styles.input}
              />
              <label>Updated At:</label>
              <input
                type="text"
                value={record.updated_at}
                onChange={(e) => updateRecordField('updated_at', e.target.value)}
                placeholder="e.g., 2025-02-23T10:05:00"
                className={styles.input}
              />
              <label>Month:</label>
              <input
                type="text"
                value={record.month}
                onChange={(e) => updateRecordField('month', e.target.value)}
                placeholder="e.g., 2"
                className={styles.input}
              />
              <label>Date EMS:</label>
              <input
                type="text"
                value={record.Date_EMS}
                onChange={(e) => updateRecordField('Date_EMS', e.target.value)}
                placeholder="e.g., 2025-02-23"
                className={styles.input}
              />
              <label>Date Target:</label>
              <input
                type="text"
                value={record.Date_target}
                onChange={(e) => updateRecordField('Date_target', e.target.value)}
                placeholder="e.g., 2025-02-24"
                className={styles.input}
              />
            </div>
            <div className={styles.modalButtons}>
              <button onClick={handleAddRecord} className={styles.button}>
                Submit
              </button>
              <button onClick={() => setShowModal(false)} className={styles.button}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

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

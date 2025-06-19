import React, { useState } from 'react';
import styles from '../components/css/ML_Predictions.module.css';

export default function ML_Predictions() {
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [prediction, setPrediction] = useState(null);
  const [predictError, setPredictError] = useState(null);
  const [predictLoading, setPredictLoading] = useState(false);

  const handleTrain = async () => {
    window.scrollTo(0, 0);
    setLoading(true);
    setError(null);
    setResults(null);
    try {
      const res = await fetch('http://127.0.0.1:5000/train_model', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await res.json();
      setResults(data);
    } catch (err) {
      console.error('Error:', err);
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  const handleTranscriptChange = (e) => {
    setTranscript(e.target.value);
  };

  const handlePredict = async (e) => {
    e.preventDefault();
    setPredictLoading(true);
    setPredictError(null);
    setPrediction(null);
    try {
      const res = await fetch('http://127.0.0.1:5000/predict', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transcript }),
      });
      const data = await res.json();
      if (data.status === 'success') {
        setPrediction(data);
      } else {
        setPredictError(data.message || 'Prediction error');
      }
    } catch (err) {
      console.error(err);
      setPredictError('Error calling prediction endpoint.');
    } finally {
      setPredictLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Machine Learning Predictions</h1>
      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Training Results</h2>
        <button className={styles.button} onClick={handleTrain} disabled={loading}>
          {loading ? 'Training...' : 'Train Models'}
        </button>
        {loading && <p>Loading model training results...</p>}
        {error && <p className={styles.error}>Error: {error.message}</p>}
        {results && results.status === 'success' && (
          <div className={styles.trainingResults}>
            {Object.keys(results.results).map((modelName) => (
              <div className={styles.modelResult} key={modelName}>
                <h3 className={styles.modelTitle}>{modelName}</h3>
                <p className={styles.accuracy}>
                  <strong>Accuracy:</strong> {results.results[modelName].accuracy.toFixed(2)}
                </p>
                <details>
                  <summary>View Detailed Report</summary>
                  <div className={styles.report}>
                    <pre>{results.results[modelName].report}</pre>
                  </div>
                </details>
              </div>
            ))}
          </div>
        )}
        {results && results.status === 'error' && (
          <p className={styles.error}>Error: {results.message}</p>
        )}
      </div>
      <hr className={styles.hr} />
      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Predict Transcript Nature</h2>
        <form className={styles.form} onSubmit={handlePredict}>
          <textarea
            className={styles.textarea}
            rows="6"
            placeholder="Enter transcript here..."
            value={transcript}
            onChange={handleTranscriptChange}
            required
          />
          <button type="submit" className={styles.button} disabled={predictLoading}>
            {predictLoading ? 'Predicting...' : 'Predict'}
          </button>
        </form>
        {predictError && <p className={styles.error}>Error: {predictError}</p>}
        {prediction && (
          <div className={styles.predictionResult}>
            <h3>Prediction Result:</h3>
            <p>
              <strong>Transcript:</strong> {prediction.transcript}
            </p>
            <p>
              <strong>Predicted Nature:</strong> {prediction.predicted_nature}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

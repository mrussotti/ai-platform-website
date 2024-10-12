import React from 'react';
import styles from './css/DataDisplay.module.css';

export default function DataDisplay({ data }) {
  if (!data.length) {
    return <p>No data available.</p>;
  }

  return (
    <div className={styles.dataDisplayContainer}>
      <h2 className={styles.heading}>Manufacturers</h2>
      <div className={styles.nodesContainer}>
        {data.map((item, index) => (
          <div key={index} className={styles.node}>
            {item.Manufacturer}
          </div>
        ))}
      </div>
    </div>
  );
}

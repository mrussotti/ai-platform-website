import React from 'react';
import styles from './css/DataDisplay.module.css';

export default function DataDisplay({ data }) {
  console.log(data);
  if (!data.length) {
    return <p>No data available.</p>;
  }

  return (
    <div className={styles.dataDisplayContainer}>
      <h2 className={styles.heading}>Query Results</h2>
      <div className={styles.nodesContainer}>
        {data.map((item, index) => {
          // Check if the item has a single key
          const keys = Object.keys(item);
          let content = null;

          if (keys.length === 1 && typeof item[keys[0]] === 'object') {
            // If item has a single key and its value is an object, display its properties
            const innerObject = item[keys[0]];
            content = Object.entries(innerObject).map(([key, value]) => (
              <div key={key}>
                <strong>{key}:</strong> {JSON.stringify(value)}
              </div>
            ));
          } else {
            // Otherwise, display the item properties directly
            content = Object.entries(item).map(([key, value]) => (
              <div key={key}>
                <strong>{key}:</strong> {JSON.stringify(value)}
              </div>
            ));
          }

          return (
            <div key={index} className={styles.node}>
              {content}
            </div>
          );
        })}
      </div>
    </div>
  );
}

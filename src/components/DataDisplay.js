import React from 'react';
import './css/DataDisplay.css'; 

export default function DataDisplay({ data }) {
  if (!data.length) {
    return <p>No data available.</p>; 
  }

  return (
    <div className="data-display-container">
      <h2>Manufacturers</h2>
      <div className="nodes-container">
        {data.map((item, index) => (
          <div key={index} className="node">
            {item.Manufacturer}
          </div>
        ))}
      </div>
    </div>
  );
}

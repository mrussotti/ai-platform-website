import React, { useState, useEffect } from 'react';
import DataDisplay from './DataDisplay';

export default function DataFetcher() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true); 
  const [error, setError] = useState(null);     

  useEffect(() => {
    fetch('https://gjz0zq3tyd.execute-api.us-east-1.amazonaws.com/dev/neo4j')
      .then(response => {
        if (!response.ok) {
          throw new Error('Network response was not ok ' + response.statusText);
        }
        return response.json(); 
      })
      .then(data => {
        setData(data);      
        setLoading(false);  
      })
      .catch(error => {
        console.error('Error fetching data:', error);
        setError(error);    
        setLoading(false);  
      });
  }, []); 

  if (loading) {
    return <p>Loading data...</p>; 
  }

  if (error) {
    return <p>Error fetching data: {error.message}</p>; 
  }

  return <DataDisplay data={data} />;
}

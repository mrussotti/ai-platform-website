import React from 'react'
import { useQuery } from '../contexts/QueryContext';
import GraphDisplay from '../components/GraphDisplay';

function GraphVisualise() {
  const { queryData } = useQuery();
  return (
    <>
    <div>
        {queryData.custom_query ? (
        <GraphDisplay />
    ) : (
        <p style={{ textAlign: 'center', marginTop: '20px',fontSize: '20px', color: 'lightcoral' }}>No Query is entered. Please enter a query first then visualise graph.</p>
    )}
    </div>
    </>
  )
}

export default GraphVisualise
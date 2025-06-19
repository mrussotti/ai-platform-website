import React, {createContext, useContext, useState} from 'react'

const QueryContext = createContext()

export const useQuery = () => {
  return useContext(QueryContext)
}

export const QueryProvider = ({ children }) => {
    const [queryData, setQueryData] = useState({ custom_query: '', dbname: ''});
    const [graphData, setGraphData] = useState(null); // Holds graph data
    return (
        <QueryContext.Provider value={{ queryData, setQueryData, graphData, setGraphData}}>
            {children}
        </QueryContext.Provider>
    )
}
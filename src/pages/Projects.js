import React, { useState, useEffect } from "react";
import DataFetcher from "../components/DataFetcher";
import styles from '../components/css/Projects.module.css';

const databases = [
  { value: "db1", label: "Database 1" },
  { value: "db2", label: "Database 2" },
  { value: "db3", label: "Database 3" },
];

export default function Projects() {
  const [selectedDb, setSelectedDb] = useState(databases[0].value);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const handleDbChange = (e) => {
    setSelectedDb(e.target.value);
  };

  return (
    <>
      <div className="text-white">
        {/* Database Selector */}
        <div className={styles.dbSelector}>
          <label htmlFor="db-select">Select Database:</label>
          <select
            id="db-select"
            value={selectedDb}
            onChange={handleDbChange}
            className={styles.select}
          >
            {databases.map((db) => (
              <option key={db.value} value={db.value}>
                {db.label}
              </option>
            ))}
          </select>
        </div>
      </div>
      <DataFetcher dbname={selectedDb} />
    </>
  );
}

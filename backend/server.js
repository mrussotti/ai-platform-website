const express = require('express');
const cors = require('cors');
const neo4j = require('neo4j-driver');

const app = express();
const PORT = 5001;
app.use(cors());
app.use(express.json());

// Neo4j AuraDB connection details
const driver = neo4j.driver(
  'neo4j+s://ccd7420d.databases.neo4j.io:7687', // Replace with your AuraDB URI
  neo4j.auth.basic('neo4j', 'SbDx8X5iHl5fdzxf5hcx_qeu3kxmpQWTzdAb2sJOVBU') // Replace with your AuraDB credentials
);

// Define an endpoint to handle Cypher queries
app.post('/api/run-cypher', async (req, res) => {
  const { query } = req.body;

  try {
    const session = driver.session();
    const result = await session.run(query);
    const records = result.records.map((record) => record.toObject());
    res.json(records);
    session.close();
  } catch (error) {
    console.error('Error executing Cypher query:', error);
    res.status(500).send('Error executing query');
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});

import React from 'react';

export default function AboutProject() {
  return (
    <div className="bg-black text-white min-h-screen">
      <h1 className="text-center text-4xl font-bold py-10">About This Project</h1>
      <div className="max-w-3xl mx-auto px-6 space-y-8">
        <section>
          <h2 className="text-2xl font-semibold mb-2">Project Overview</h2>
          <p className="text-base">
            This project provides tools to assist 911 operators by ingesting call transcripts,
            extracting structured data, and converting it into a graph representation.
            The goal is to enable advanced analytics and machine learning on emergency response data,
            improving insights into incident patterns and operator performance.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-2">Key Features</h2>
          <ul className="list-disc list-inside">
            <li>Transcript ingestion and normalization</li>
            <li>Automatic entity extraction (locations, persons, hazards)</li>
            <li>Similarity-based incident deduplication</li>
            <li>Graph persistence using Neo4j for flexible querying</li>
            <li>RESTful API endpoints for real-time processing</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-2">Architecture</h2>
          <p className="text-base">
            The backend is a Flask microservice that decodes Base64 transcripts,
            runs NLP extraction, and performs deduplication via TF-IDF and Jaccard similarity.
            Structured data is stored in Neo4j with nodes for Incidents, CallDetails,
            Locations, Descriptions, and Persons, connected by semantic relationships.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-2">Technology Stack</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h3 className="font-medium">Frontend</h3>
              <p>React, Tailwind CSS</p>
            </div>
            <div>
              <h3 className="font-medium">Backend</h3>
              <p>Python, Flask, Neo4j, scikit-learn</p>
            </div>
            <div>
              <h3 className="font-medium">Data Processing</h3>
              <p>NLP extraction utilities, sklearn TF-IDF</p>
            </div>
            <div>
              <h3 className="font-medium">Storage</h3>
              <p>Neo4j Graph Database, JSON flat-file for similarity history</p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

import React from 'react';
import SequenceDiagram from '../assets/911_sequence_diagram.png';

export default function AboutProject() {
  return (
    <div className="bg-black text-white min-h-screen py-10">
      <div className="max-w-3xl mx-auto px-6 space-y-8">
        <h1 className="text-center text-4xl font-bold">About This Project</h1>

        <section>
          <h2 className="text-2xl font-semibold mb-2">What It Does</h2>
          <p className="text-base">
            A simple web application for 911 centers to upload call transcripts as spreadsheets,
            automatically extract key details (location, summary, participants),
            deduplicate similar incidents, and store everything in a graph database for
            fast, flexible queries and analytics.

            The next stage of this project is to use the graph represtation of these 911 calls to perform machine learning.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-2">Why It Matters</h2>
          <ul className="list-disc list-inside">
            <li>Speeds up data entry by automating transcript processing</li>
            <li>Detects repeated or related incidents automatically</li>
            <li>Enables rich, graph-based reporting and machine-learning insights</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-2">How It Works</h2>
          <p className="text-base">
            Users upload a CSV of call transcripts via the React UI. The frontend parses
            the file and sends rows to a Flask API, which extracts structured fields,
            runs similarity checks to avoid duplicates, and writes nodes and
            relationships into Neo4j for graph storage and exploration.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-2">Tech Stack</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h3 className="font-medium">Frontend</h3>
              <p>React, Tailwind CSS</p>
            </div>
            <div>
              <h3 className="font-medium">Backend</h3>
              <p>Python, Flask</p>
            </div>
            <div>
              <h3 className="font-medium">Data Processing</h3>
              <p>Custom NLP extraction, similarity matching</p>
            </div>
            <div>
              <h3 className="font-medium">Database</h3>
              <p>Neo4j Graph Database</p>
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-2">Sequence Diagram</h2>
          <div className="mt-4">
            <img
              src={SequenceDiagram}
              alt="911 Upload Sequence Diagram"
              className="w-full rounded border border-gray-700"
            />
          </div>
        </section>
      </div>
    </div>
  );
}

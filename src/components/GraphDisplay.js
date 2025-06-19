import React, {useEffect, useState,useRef} from 'react'
import { API } from 'aws-amplify'; 
import { useQuery } from '../contexts/QueryContext';
import * as d3 from "d3";

function GraphDisplay() {
  const svgRef = useRef(null);
  const graphInitialized = useRef(false);
  const { queryData} = useQuery();
  const query = queryData.custom_query;
  const dbname = queryData.dbname;
  const { graphData, setGraphData } = useQuery();
  const apiName = 'aiPlatformApiDev';
  const usedColors = new Set();
  const path = `/neo4j/${dbname}`;
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selectedNode, setSelectedNode] = useState(null);
  const colorMapping = {};


  useEffect(() => {
    const svgElement = svgRef.current;
    if (!svgElement) {
      return;
    }

    if (!graphInitialized.current) {
      renderGraph(query);
      graphInitialized.current = true;
    }
  }, [query]);
  


  // Function to generate a light color for the nodes
  const generateLightColor = () => {
    let color;
    do {
      color = `hsl(${Math.floor(Math.random() * 360)}, 70%, 80%)`;
    } while (usedColors.has(color));
    usedColors.add(color);
    return color;
  };


  // Function to assign color to labels
  const assignColorToLabel = (label) => {
    if (!colorMapping[label]) {
      colorMapping[label] = generateLightColor();
    }
    return colorMapping[label];
  };


  // Fetch graph data (Neo4j query result) from an API
    const fetchData = async (query = null) => {
      setError(null);
      setLoading(true);
      try {
        let responseData;
        if (query) {
          responseData = await API.post(apiName, path, {
            body: { query },
            headers: { 'Content-Type': 'application/json' },
          });
        } else {
          responseData = await API.get(apiName, path, {});
        }
        return responseData;
      } catch (err) {
        console.error('Error fetching data:', err);
        setError(err);
        return null;
      } finally {
        setLoading(false); // Set loading to false when data fetching is complete
      }
    };




//   // // Function to render the graph
  const renderGraph = async (query) => {
    let data=graphData;
    if (!data){
      data = await fetchData(query);
      setGraphData(data)
    }else{
      data=graphData;
    }
    if (!data) {
      return;
    }
    let svg = d3.select(svgRef.current);
    if (!svgRef.current) {
      return;
    }
    var width = svg.attr('width')
    var height = svg.attr('height')

    const g = svg.append("g");

    const zoom = d3.zoom()
    .scaleExtent([0.1, 4]) // Set min and max zoom scale
    .on("zoom", (event) => {
        g.attr("transform", event.transform);
    });

    var node2=data[0].n
    var path2=data[0].p
    var graph={nodes:[],links:[]}

    svg.call(zoom);
    const nodesInGraph = [];
    const linksInGraph = [];
    const nodeIds = new Set(); // To keep track of unique node ids
    if (node2 && !path2){
        data.forEach(record=>{
            const node=record.n;
            if (!nodeIds.has(node.id)) {
                nodesInGraph.push({
                    id: node.id,
                    labels: node.labels,
                    properties: node.properties
                });
                nodeIds.add(node.id);
            }
        })
        graph.nodes=nodesInGraph;
    }
    else if (path2){
        data.forEach(record => {
            const path = record.p
            const startNode = path.nodes[0];
            const endNode = path.nodes[1];
            if (!nodeIds.has(startNode.id)) {
                nodesInGraph.push(startNode);
                nodeIds.add(startNode.id);
            }
            
            if (!nodeIds.has(endNode.id)) {
                nodesInGraph.push(endNode);
                nodeIds.add(endNode.id);
            }
            linksInGraph.push({
                source: startNode.id,
                target: endNode.id,
                type: path.relationships[0].type
            });
        });
        
        graph.nodes=nodesInGraph;
        graph.links=linksInGraph;
    }

    var simulation = d3.forceSimulation(graph.nodes)
                    .force("link", d3.forceLink(graph.links)
                        .id(d => d.id)
                        .distance(100)
                        .links(graph.links)
                    )
                    .force('charge', d3.forceManyBody()
                        .strength(-100)
                        .distanceMax(200)  // Limit repulsion range to avoid affecting distant clusters
                    )
                    .force('center', d3.forceCenter(width / 2, height / 2))
                    .on("tick", ticked);

    var link = g.append('g')
    .selectAll('line')
    .data(graph.links)
    .enter().append('line')
    .attr('stroke-width',function(d){
        return 5
    })
    .attr('stroke', 'black')
    .on("click", showEdgeInfo)
    .style("cursor", "pointer")
    .on("mouseover", function() {
      d3.select(this).attr('stroke', 'limegreen');
    })
    .on("mouseout", function() {
        d3.select(this).attr('stroke', 'black');
    });

    var node = g.append('g')
        .selectAll('circle')
        .data(graph.nodes)
        .enter().append('circle')
        .attr('r', 30)
        .attr('fill', d => {
            // Assign color based on the first label (or any specific logic)
            return assignColorToLabel(d.labels[0]) || '#CF9FFF'; // Default color set to light violet
        })
        .style("cursor", "pointer")
        .attr("stroke","black")
        .on("click", showNodeInfo)
        .call(d3.drag()
            .on("start", dragstarted)
            .on("drag", dragged)
            .on("end", dragended)
        );

    var labels = g.append('g')
    .selectAll('text')
    .data(graph.nodes)
    .enter().append('text')
    .attr('text-anchor', 'middle') // Center the text within the node
    .attr('dy', '.35em') // Adjusts text vertically to be centered in the circle
    .text(d => [truncateText(d.labels[0], 40),truncateText(`ID: ${d.id}`, 40)]);
    

    function showNodeInfo(event, d) {
        setSelectedNode(d);

        // Highlight selected node
        node.attr('fill', (nodeData) => nodeData.id === d.id ? '#4C8BF5' : assignColorToLabel(nodeData.labels[0]))
        .attr('stroke', (nodeData) => nodeData.id === d.id ? 'lightblue' : 'black');
        
        const infoContainer = document.getElementById('node-info');
        infoContainer.innerHTML = `
            <strong>ID:</strong> ${d.id}<br>
            <strong>Label:</strong> ${d.labels.join(', ')}<br>
            <strong>Properties:</strong> <pre>${JSON.stringify(d.properties, null, 2)}</pre>
        `;
    }
    function showEdgeInfo(event, d) {

      const infoContainer = document.getElementById('node-info');
      infoContainer.innerHTML = `
          <strong>Type:</strong> ${d.type}<br>
          <strong>Source:</strong> ${d.source.id}<br>
          <strong>Target:</strong> ${d.target.id}<br>
      `;
    }

    function truncateText(text, maxWidth) {
        // Create a temporary text element to measure the width
        var tempText = svg.append("text")
            .attr("font-size", 12)
            .text(text);

        let truncatedText = text;
        while (tempText.node().getBBox().width > maxWidth && truncatedText.length > 0) {
            truncatedText = truncatedText.slice(0, -1); // Remove one character at a time
            tempText.text(truncatedText + "...");
        }
        tempText.remove(); // Remove the temporary element

        return truncatedText.length < text.length ? truncatedText + "..." : truncatedText;
    }

    function ticked(){
        link
            .attr("x1",function(d){
                return d.source.x;
            })
            .attr("y1",function(d){
                return d.source.y;
            })
            .attr("x2",function(d){
                return d.target.x;
            })
            .attr("y2",function(d){
                return d.target.y;
            })

        node
            .attr("cx",function(d){
                return d.x;
            })
            .attr("cy",function(d){
                return d.y;
            })
        labels
            .attr("x", function(d) { return d.x; })
            .attr("y", function(d) { return d.y; });
    }

    function dragstarted(event, d) {
        if (!event.active) simulation.alphaTarget(0.3).restart();
        d.fx = d.x;
        d.fy = d.y;
    }

    function dragged(event, d) {
        d.fx = event.x;
        d.fy = event.y;
    }

    function dragended(event, d) {
        if (!event.active) simulation.alphaTarget(0);
        d.fx = null;
        d.fy = null;
    }
}

  return (
    <>
      <div style={{
          padding: "5px",
          backgroundColor: "black",
          borderRadius: "6px",
          color: "white",
          fontFamily: "Arial, sans-serif",
          display: "flex", 
          flexDirection: "row", // Horizontal alignment
          alignItems: "center", // Center vertically
          overflow: "hidden",
          marginBottom: "5px",
          border: "1px solid #ddd"
        }}>
        <h3 style={{
            fontSize: "16px",
            fontWeight: "600",
            color: "white",
        }}>
          Entered Query:
        </h3>
        <div style={{
            fontSize: "14px",
            wordWrap: 'break-word',
            lineHeight: "1.5",
            color: "white",
            backgroundColor: "black",
            padding: "5px",
            borderRadius: "4px",
            whiteSpace: "pre-wrap",
            wordBreak: "break-word",
            flex: 1, // Allow the query container to take the remaining space
            maxWidth: "calc(100% - 100px)", // Ensure it doesn’t overflow the container
            overflowX: "auto", // Horizontal scrolling for long queries
            overflowY: "auto",
            maxHeight: "30px",
            marginLeft: "10px" // Space between title and query container
        }}>
          {query}
        </div>
      </div>


      <div style={{ display: 'flex' }}>
        <svg
          ref={svgRef}
          id="graph"
          width="1050"
          height="700"
          style={{ border: '5px solid #add8e6', backgroundColor: "#f0f8ff" }}
        >
          {/* Loading and Error message rendering */}
          {loading && (
            <text
              x="50%"
              y="50%"
              textAnchor="middle"
              fontSize="20"
              fill="black"
              dy="0.35em"
            >
              Loading data, please wait...
            </text>
          )}
          {error && (
            <text
              x="50%"
              y="50%"
              textAnchor="middle"
              fontSize="20"
              fill="red"
              dy="0.35em"
            >
              Error fetching data: {error.message}.
              <tspan x="50%" dy="1.2em">Please check your query or network connection.</tspan>
            </text>
          )}
        </svg>
        <div className="sidebar" style={{ width: "350px", marginLeft: "20px",overflowY: 'auto',overflowX: 'auto', border: "5px solid #ccc", padding: "10px", color: "white" ,height: "700px" }}>
            <h2 style={{fontSize: "16px", fontWeight: "600",textDecoration:"underline"}}>NODE/EDGE INFORMATION</h2>
            <p id="node-info">Click on a node or edge to see details here.</p>
      </div>
      </div>
    </>
  );
}

export default GraphDisplay

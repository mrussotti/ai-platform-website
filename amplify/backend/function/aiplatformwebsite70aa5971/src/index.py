# index.py

import json
import os
import csv
import io
import sys
import traceback
from neo4j import GraphDatabase
from neo4j.exceptions import Neo4jError
from neo4j.graph import Node, Relationship, Path
from neo4j.time import DateTime, Date

def serialize_value(value):
    if isinstance(value, Node):
        return {
            'id': value.id,
            'labels': list(value.labels),
            'properties': {k: serialize_value(v) for k, v in value.items()}
        }
    elif isinstance(value, Relationship):
        return {
            'id': value.id,
            'type': value.type,
            'start_node_id': value.start_node.id,
            'end_node_id': value.end_node.id,
            'properties': {k: serialize_value(v) for k, v in value.items()}
        }
    elif isinstance(value, (int, float, str, bool, type(None))):
        return value
    elif isinstance(value, list):
        return [serialize_value(v) for v in value]
    elif isinstance(value, dict):
        return {k: serialize_value(v) for k, v in value.items()}
    elif isinstance(value, (DateTime, Date)):
        return value.iso_format()
    else:
        return str(value)

def lambda_handler(event, context):
    print('Received event:', json.dumps(event))

    http_method = event.get('httpMethod', '')
    path = event.get('path', '')
    query_params = event.get('queryStringParameters', {}) or {}

    # Handle OPTIONS requests for CORS preflight
    if http_method == 'OPTIONS':
        response = {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type',
            },
            'body': ''
        }
        return response

    path_parts = path.strip('/').split('/')
    if len(path_parts) >= 2 and path_parts[0] == 'neo4j':
        dbname = path_parts[1]
        uri_env = f'NEO4J_URI_{dbname}'
        username_env = f'NEO4J_USERNAME_{dbname}'
        password_env = f'NEO4J_PASSWORD_{dbname}'

        NEO4J_URI = os.environ.get(uri_env)
        NEO4J_USERNAME = os.environ.get(username_env)
        NEO4J_PASSWORD = os.environ.get(password_env)

        if not NEO4J_URI or not NEO4J_USERNAME or not NEO4J_PASSWORD:
            error_message = f'Invalid database name or missing credentials for {dbname}'
            print(error_message)
            response = {
                'statusCode': 400,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({'error': error_message})
            }
            return response

        try:
            print(f'Connecting to Neo4j at {NEO4J_URI} with user {NEO4J_USERNAME}')
            with GraphDatabase.driver(NEO4J_URI, auth=(NEO4J_USERNAME, NEO4J_PASSWORD)) as driver:
                if http_method == 'GET':
                    # Check if 'export' parameter is present
                    if query_params.get('export') == 'csv':
                        return export_graph_to_csv(driver)
                    else:
                        return get_default_data(driver)
                elif http_method == 'POST':
                    return handle_custom_query(driver, event)
                else:
                    error_message = 'Method Not Allowed'
                    print(error_message)
                    response = {
                        'statusCode': 405,
                        'headers': {
                            'Content-Type': 'application/json',
                            'Access-Control-Allow-Origin': '*',
                            'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
                            'Access-Control-Allow-Headers': 'Content-Type',
                        },
                        'body': json.dumps({'error': error_message})
                    }
                    return response
        except Exception as e:
            error_message = f'Error initializing Neo4j driver: {str(e)}'
            print(error_message)
            traceback.print_exc()
            response = {
                'statusCode': 500,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({'error': error_message})
            }
            return response
    else:
        error_message = 'Not found'
        print(error_message)
        response = {
            'statusCode': 404,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({'error': error_message})
        }
        return response

def get_default_data(driver):
    try:
        with driver.session() as session:
            print('Executing default data query')
            result = session.run('MATCH (n) RETURN n LIMIT 10')
            records = []
            for record in result:
                record_data = {key: serialize_value(value) for key, value in record.items()}
                records.append(record_data)
            response = {
                'statusCode': 200,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps(records)
            }
            return response
    except Neo4jError as e:
        error_message = f'Database error during default data query: {str(e)}'
        print(error_message)
        traceback.print_exc()
        response = {
            'statusCode': 500,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({'error': error_message})
        }
        return response
    except Exception as e:
        error_message = f'Internal server error during default data query: {str(e)}'
        print(error_message)
        traceback.print_exc()
        response = {
            'statusCode': 500,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({'error': error_message})
        }
        return response

def handle_custom_query(driver, event):
    try:
        body_str = event.get('body', '{}') or '{}'
        print('Event Body:', body_str)
        body = json.loads(body_str)
        query = body.get('query', '')
        if not query:
            error_message = 'No query provided'
            print(error_message)
            response = {
                'statusCode': 400,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({'error': error_message})
            }
            return response
        with driver.session() as session:
            print(f'Executing custom query: {query}')
            result = session.run(query)
            print("Result: ", result)
            records = []
            for record in result:
                print("Record: ", record)
                record_data = {}
                for key, value in record.items():
                    if isinstance(value, Path):
                        record_data[key] = {
                            'nodes': [serialize_value(node) for node in value.nodes],
                            'relationships': [serialize_value(rel) for rel in value.relationships],
                        }
                    else:
                        record_data[key] = serialize_value(value)
                records.append(record_data)
            # Handle cases where no records are returned
            if not records:
                response_body = {'message': 'Query executed successfully.'}
            else:
                response_body = records
            response = {
                'statusCode': 200,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps(response_body)
            }
            return response
    except json.JSONDecodeError as e:
        error_message = f'Invalid JSON in request body: {str(e)}'
        print(error_message)
        traceback.print_exc()
        response = {
            'statusCode': 400,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({'error': error_message})
        }
        return response
    except Neo4jError as e:
        error_message = f'Database error during custom query: {str(e)}'
        print(error_message)
        traceback.print_exc()
        response = {
            'statusCode': 500,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({'error': error_message})
        }
        return response
    except Exception as e:
        error_message = f'Internal server error during custom query: {str(e)}'
        print(error_message)
        traceback.print_exc()
        response = {
            'statusCode': 500,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({'error': error_message})
        }
        return response

def export_graph_to_csv(driver):
    try:
        with driver.session() as session:
            print("Starting CSV export")
            # Fetch all nodes
            print("Fetching nodes")
            nodes_result = session.run('MATCH (n) RETURN n LIMIT 100')
            nodes = []
            for record in nodes_result:
                node = record['n']
                node_data = node._properties.copy()
                node_data['id'] = node.id
                node_data['labels'] = ';'.join(node.labels)
                nodes.append(node_data)
            print(f"Fetched {len(nodes)} nodes")

            # Fetch all relationships
            print("Fetching relationships")
            rels_result = session.run('MATCH ()-[r]->() RETURN r LIMIT 100')
            relationships = []
            for record in rels_result:
                rel = record['r']
                rel_data = rel._properties.copy()
                rel_data['id'] = rel.id
                rel_data['type'] = rel.type
                rel_data['start_node_id'] = rel.start_node.id
                rel_data['end_node_id'] = rel.end_node.id
                relationships.append(rel_data)
            print(f"Fetched {len(relationships)} relationships")

            # Convert nodes and relationships to CSV format
            print("Converting nodes to CSV")
            nodes_csv = convert_to_csv(nodes)
            print("Converting relationships to CSV")
            relationships_csv = convert_to_csv(relationships)

            # Combine the CSV data
            csv_data = f"Nodes\n{nodes_csv}\nRelationships\n{relationships_csv}"

            # Check the size of the CSV data
            csv_size = sys.getsizeof(csv_data)
            print(f"Total CSV data size: {csv_size} bytes")

            # Ensure the CSV data size is within limits (6 MB for API Gateway)
            if csv_size > 6 * 1024 * 1024:
                error_message = "CSV data size exceeds the maximum allowed size of 6 MB"
                print(error_message)
                response = {
                    'statusCode': 413,  # Payload Too Large
                    'headers': {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    },
                    'body': json.dumps({'error': error_message})
                }
                return response

            # Return the CSV data directly
            print("Returning CSV data")
            response = {
                'statusCode': 200,
                'headers': {
                    'Content-Type': 'text/csv',
                    'Content-Disposition': 'attachment; filename="graph_export.csv"',
                    'Access-Control-Allow-Origin': '*',
                },
                'body': csv_data
            }
            return response
    except Exception as e:
        error_message = f'Error exporting graph to CSV: {str(e)}'
        print(error_message)
        traceback.print_exc()
        response = {
            'statusCode': 500,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({'error': error_message})
        }
        return response

def convert_to_csv(data_list):
    if not data_list:
        return ''
    output = io.StringIO()
    fieldnames = set()
    # Collect all fieldnames from all dictionaries
    for data in data_list:
        fieldnames.update(data.keys())
    fieldnames = list(fieldnames)
    writer = csv.DictWriter(output, fieldnames=fieldnames)
    writer.writeheader()
    for data in data_list:
        # Ensure all keys are present in data
        row = {key: data.get(key, '') for key in fieldnames}
        writer.writerow(row)
    return output.getvalue()

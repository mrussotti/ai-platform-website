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

from batch_utils import process_csv_file  # ← New import

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

def handler(event, context):
    print('Received event:', json.dumps(event))
    http_method = event.get('httpMethod', '')
    path = event.get('path', '')
    query_params = event.get('queryStringParameters', {}) or {}

    # CORS preflight
    if http_method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type',
            },
            'body': ''
        }

    # ----------------------------------------------------------------
    # New batch-upload endpoint for CSV of 911 records
    # ----------------------------------------------------------------
    if path == '/process_all_transcripts' and http_method == 'POST':
        try:
            body = json.loads(event.get('body', '[]') or '[]')
            # process_csv_file expects a list of row‐dicts
            result = process_csv_file(body)
            return {
                'statusCode': 200,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps(result)
            }
        except Exception as e:
            print('Error in batch upload:', str(e))
            traceback.print_exc()
            return {
                'statusCode': 500,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({'error': str(e)})
            }

    # ----------------------------------------------------------------
    # Existing /neo4j/<dbname> logic
    # ----------------------------------------------------------------
    path_parts = path.strip('/').split('/')
    if len(path_parts) >= 2 and path_parts[0] == 'neo4j':
        dbname = path_parts[1]
        uri_env = f'NEO4J_URI_{dbname}'
        username_env = f'NEO4J_USERNAME_{dbname}'
        password_env = f'NEO4J_PASSWORD_{dbname}'

        NEO4J_URI      = os.environ.get(uri_env)
        NEO4J_USERNAME = os.environ.get(username_env)
        NEO4J_PASSWORD = os.environ.get(password_env)

        if not NEO4J_URI or not NEO4J_USERNAME or not NEO4J_PASSWORD:
            error_message = f'Invalid database name or missing credentials for {dbname}'
            print(error_message)
            return {
                'statusCode': 400,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({'error': error_message})
            }

        try:
            print(f'Connecting to Neo4j at {NEO4J_URI} with user {NEO4J_USERNAME}')
            with GraphDatabase.driver(NEO4J_URI, auth=(NEO4J_USERNAME, NEO4J_PASSWORD)) as driver:
                if http_method == 'GET':
                    if query_params.get('export') == 'csv':
                        return export_graph_to_csv(driver)
                    else:
                        return get_default_data(driver)
                elif http_method == 'POST':
                    return handle_custom_query(driver, event)
                else:
                    return {
                        'statusCode': 405,
                        'headers': {
                            'Content-Type': 'application/json',
                            'Access-Control-Allow-Origin': '*',
                            'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
                            'Access-Control-Allow-Headers': 'Content-Type',
                        },
                        'body': json.dumps({'error': 'Method Not Allowed'})
                    }
        except Exception as e:
            print(f'Error initializing Neo4j driver: {str(e)}')
            traceback.print_exc()
            return {
                'statusCode': 500,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({'error': str(e)})
            }

    # Fallback for any other path
    return {
        'statusCode': 404,
        'headers': {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
        },
        'body': json.dumps({'error': 'Not found'})
    }


def get_default_data(driver):
    try:
        with driver.session() as session:
            result = session.run('MATCH (n) RETURN n LIMIT 10')
            records = []
            for record in result:
                records.append({k: serialize_value(v) for k,v in record.items()})
            return {
                'statusCode': 200,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps(records)
            }
    except Neo4jError as e:
        print(f'Database error during default data query: {e}')
        traceback.print_exc()
        return {
            'statusCode': 500,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({'error': str(e)})
        }


def handle_custom_query(driver, event):
    try:
        body_str = event.get('body', '{}') or '{}'
        body = json.loads(body_str)
        query = body.get('query', '')
        if not query:
            return {
                'statusCode': 400,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({'error': 'No query provided'})
            }
        with driver.session() as session:
            result = session.run(query)
            records = []
            for record in result:
                record_data = {}
                for key, value in record.items():
                    if isinstance(value, Path):
                        record_data[key] = {
                            'nodes': [serialize_value(n) for n in value.nodes],
                            'relationships': [serialize_value(r) for r in value.relationships]
                        }
                    else:
                        record_data[key] = serialize_value(value)
                records.append(record_data)
            body = records or {'message': 'Query executed successfully.'}
            return {
                'statusCode': 200,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps(body)
            }
    except Exception as e:
        print(f'Error during custom query: {e}')
        traceback.print_exc()
        return {
            'statusCode': 500,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({'error': str(e)})
        }


def export_graph_to_csv(driver):
    try:
        with driver.session() as session:
            nodes = []
            for rec in session.run('MATCH (n) RETURN n LIMIT 100'):
                n = rec['n']
                props = n._properties.copy()
                props.update({'id': n.id, 'labels': ';'.join(n.labels)})
                nodes.append(props)

            rels = []
            for rec in session.run('MATCH ()-[r]->() RETURN r LIMIT 100'):
                r = rec['r']
                props = r._properties.copy()
                props.update({
                    'id': r.id,
                    'type': r.type,
                    'start_node_id': r.start_node.id,
                    'end_node_id': r.end_node.id
                })
                rels.append(props)

            nodes_csv = convert_to_csv(nodes)
            rels_csv  = convert_to_csv(rels)
            csv_data  = f"Nodes\n{nodes_csv}\nRelationships\n{rels_csv}"

            if sys.getsizeof(csv_data) > 6*1024*1024:
                return {
                    'statusCode': 413,
                    'headers': {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    },
                    'body': json.dumps({'error': 'CSV data size exceeds 6 MB'})
                }

            return {
                'statusCode': 200,
                'headers': {
                    'Content-Type': 'text/csv',
                    'Content-Disposition': 'attachment; filename=\"graph_export.csv\"',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': csv_data
            }
    except Exception as e:
        print(f'Error exporting graph: {e}')
        traceback.print_exc()
        return {
            'statusCode': 500,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({'error': str(e)})
        }


def convert_to_csv(data_list):
    if not data_list:
        return ''
    output = io.StringIO()
    # collect fieldnames
    fieldnames = set()
    for item in data_list:
        fieldnames.update(item.keys())
    fieldnames = list(fieldnames)
    writer = csv.DictWriter(output, fieldnames=fieldnames)
    writer.writeheader()
    for item in data_list:
        row = {key: item.get(key, '') for key in fieldnames}
        writer.writerow(row)
    return output.getvalue()

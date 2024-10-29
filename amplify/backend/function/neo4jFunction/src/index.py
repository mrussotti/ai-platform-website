import json
import os
import csv
import base64
from neo4j import GraphDatabase
from neo4j.exceptions import Neo4jError
from neo4j.graph import Node, Relationship
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
            response = {
                'statusCode': 400,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({'error': f'Invalid database name or missing credentials for {dbname}'})
            }
            return response

        try:
            print(f'Connecting to Neo4j at {NEO4J_URI} with user {NEO4J_USERNAME}')
            with GraphDatabase.driver(NEO4J_URI, auth=(NEO4J_USERNAME, NEO4J_PASSWORD)) as driver:
                if http_method == 'GET':
                    # Check if 'export' parameter is present
                    if query_params.get('export') == 'csv':
                        # Implement export functionality if needed
                        pass
                    else:
                        try:
                            with driver.session() as session:
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
                            print('Neo4jError:', repr(e))
                            response = {
                                'statusCode': 500,
                                'headers': {
                                    'Content-Type': 'application/json',
                                    'Access-Control-Allow-Origin': '*'
                                },
                                'body': json.dumps({'error': 'Database error: ' + str(e)})
                            }
                            return response
                        except Exception as e:
                            print('General Exception in GET:', repr(e))
                            response = {
                                'statusCode': 500,
                                'headers': {
                                    'Content-Type': 'application/json',
                                    'Access-Control-Allow-Origin': '*'
                                },
                                'body': json.dumps({'error': 'Internal server error: ' + str(e)})
                            }
                            return response
                elif http_method == 'POST':
                    # Handle custom query
                    try:
                        body_str = event.get('body', '{}') or '{}'
                        print('Event Body:', body_str)
                        body = json.loads(body_str)
                        query = body.get('query', '')
                        if not query:
                            response = {
                                'statusCode': 400,
                                'headers': {
                                    'Content-Type': 'application/json',
                                    'Access-Control-Allow-Origin': '*'
                                },
                                'body': json.dumps({'error': 'No query provided'})
                            }
                            return response
                        with driver.session() as session:
                            result = session.run(query)
                            records = []
                            for record in result:
                                record_data = {key: serialize_value(value) for key, value in record.items()}
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
                        print('JSONDecodeError:', repr(e))
                        response = {
                            'statusCode': 400,
                            'headers': {
                                'Content-Type': 'application/json',
                                'Access-Control-Allow-Origin': '*'
                            },
                            'body': json.dumps({'error': 'Invalid JSON in request body'})
                        }
                        return response
                    except Neo4jError as e:
                        print('Neo4jError:', repr(e))
                        response = {
                            'statusCode': 500,
                            'headers': {
                                'Content-Type': 'application/json',
                                'Access-Control-Allow-Origin': '*'
                            },
                            'body': json.dumps({'error': 'Database error: ' + str(e)})
                        }
                        return response
                    except Exception as e:
                        print('General Exception in POST:', repr(e))
                        response = {
                            'statusCode': 500,
                            'headers': {
                                'Content-Type': 'application/json',
                                'Access-Control-Allow-Origin': '*'
                            },
                            'body': json.dumps({'error': 'Internal server error: ' + str(e)})
                        }
                        return response
                else:
                    response = {
                        'statusCode': 405,
                        'headers': {
                            'Content-Type': 'application/json',
                            'Access-Control-Allow-Origin': '*',
                            'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
                            'Access-Control-Allow-Headers': 'Content-Type',
                        },
                        'body': json.dumps({'error': 'Method Not Allowed'})
                    }
                    return response
        except Exception as e:
            print('Error initializing Neo4j driver:', repr(e))
            response = {
                'statusCode': 500,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({'error': 'Error initializing Neo4j driver: ' + str(e)})
            }
            return response
    else:
        response = {
            'statusCode': 404,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({'error': 'Not found'})
        }
        return response

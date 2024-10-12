import json
import os
import socket
from neo4j import GraphDatabase
from neo4j.exceptions import Neo4jError

def validate_query(query):
    allowed_keywords = ['MATCH', 'RETURN', 'WHERE', 'LIMIT', 'SKIP', 'ORDER BY']
    disallowed_keywords = ['CREATE', 'MERGE', 'DELETE', 'SET', 'DROP', 'REMOVE', 'CALL', 'LOAD', 'UNWIND']

    query_upper = query.upper()

    # Check for disallowed keywords
    if any(keyword in query_upper for keyword in disallowed_keywords):
        return False

    # Ensure the query starts with an allowed keyword
    if not any(query_upper.strip().startswith(keyword) for keyword in allowed_keywords):
        return False

    return True

def lambda_handler(event, context):
    print('Received event:', json.dumps(event))

    http_method = event.get('httpMethod', '')
    path = event.get('path', '')

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
                'body': json.dumps({'error': f'Invalid database name or missing credentials for {dbname}'})
            }
            return response

        try:
            with GraphDatabase.driver(NEO4J_URI, auth=(NEO4J_USERNAME, NEO4J_PASSWORD)) as driver:
                if http_method == 'GET':
                    try:
                        with driver.session() as session:
                            result = session.run('MATCH (n) RETURN n LIMIT 10')
                            records = [dict(record['n']) for record in result]
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
                        print('Neo4jError:', e)
                        response = {
                            'statusCode': 500,
                            'body': json.dumps({'error': 'Database error: ' + str(e)})
                        }
                        return response
                    except Exception as e:
                        print('General Exception:', e)
                        response = {
                            'statusCode': 500,
                            'body': json.dumps({'error': 'Internal server error: ' + str(e)})
                        }
                        return response
                elif http_method == 'POST':
                    # Handle custom query
                    try:
                        body = json.loads(event.get('body', '{}'))
                        query = body.get('query', '')
                        if not query:
                            response = {
                                'statusCode': 400,
                                'body': json.dumps({'error': 'No query provided'})
                            }
                            return response
                        # Validate query
                        if not validate_query(query):
                            response = {
                                'statusCode': 400,
                                'body': json.dumps({'error': 'Invalid query'})
                            }
                            return response
                        with driver.session() as session:
                            result = session.run(query)
                            records = [dict(record) for record in result]
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
                        print('Neo4jError:', e)
                        response = {
                            'statusCode': 500,
                            'body': json.dumps({'error': 'Database error: ' + str(e)})
                        }
                        return response
                    except ValueError as e:
                        print('Validation Error:', e)
                        response = {
                            'statusCode': 400,
                            'body': json.dumps({'error': str(e)})
                        }
                        return response
                    except Exception as e:
                        print('General Exception:', e)
                        response = {
                            'statusCode': 500,
                            'body': json.dumps({'error': 'Internal server error: ' + str(e)})
                        }
                        return response
                else:
                    response = {
                        'statusCode': 405,
                        'body': json.dumps({'error': 'Method Not Allowed'})
                    }
                    return response
        except Exception as e:
            print('Error initializing Neo4j driver:', e)
            response = {
                'statusCode': 500,
                'body': json.dumps({'error': 'Error initializing Neo4j driver: ' + str(e)})
            }
            return response
    else:
        response = {
            'statusCode': 404,
            'body': json.dumps({'error': 'Not found'})
        }
        return response

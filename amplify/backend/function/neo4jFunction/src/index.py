import json
import os
import socket
from neo4j import GraphDatabase
from neo4j.exceptions import Neo4jError

# Retrieve environment variables
NEO4J_URI = os.environ.get('NEO4J_URI')
NEO4J_USERNAME = os.environ.get('NEO4J_USERNAME')
NEO4J_PASSWORD = os.environ.get('NEO4J_PASSWORD')

# Log environment variables for debugging
print('NEO4J_URI:', NEO4J_URI)
print('NEO4J_USERNAME:', NEO4J_USERNAME)

# Initialize Neo4j driver
try:
    driver = GraphDatabase.driver(NEO4J_URI, auth=(NEO4J_USERNAME, NEO4J_PASSWORD))
except Exception as e:
    print('Error initializing Neo4j driver:', e)

def lambda_handler(event, context):
    # Log the event for debugging
    print('Received event:', json.dumps(event))

    # Test DNS resolution
    try:
        from urllib.parse import urlparse
        parsed_uri = urlparse(NEO4J_URI)
        hostname = parsed_uri.hostname
        ip = socket.gethostbyname(hostname)
        print(f'Resolved {hostname} to IP:', ip)
    except Exception as e:
        print('DNS resolution error:', e)
    # Parse HTTP method and path
    http_method = event.get('httpMethod', '')
    path = event.get('path', '')

    if http_method == 'GET' and path.endswith('/neo4j'):
        try:
            with driver.session() as session:
                # Sample Cypher query
                result = session.run('MATCH (n) RETURN n LIMIT 10')
                print(result)
                # Extract data
                records = [dict(record['n']) for record in result]
                # Build response
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
    else:
        response = {
            'statusCode': 404,
            'body': json.dumps({'error': 'Not found'})
        }
        return response

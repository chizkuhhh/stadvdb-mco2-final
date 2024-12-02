from flask import jsonify, request
from app import app  # Import the app object
from app.db_config import get_db_connection

@app.route('/simulate', methods=['POST'])
def simulate_transaction():
    data = request.json
    node = data['node']
    queries = data['queries']
    isolation_level = data.get('isolation_level', 'READ COMMITTED')

    connection = None
    cursor = None

    try:
        # Attempt to connect to the database
        connection = get_db_connection(node)
        cursor = connection.cursor(dictionary=True)  # Use dictionary cursor

        # Set the isolation level and start the transaction
        cursor.execute(f"SET TRANSACTION ISOLATION LEVEL {isolation_level};")
        cursor.execute("START TRANSACTION;")

        results = []
        for query in queries:
            cursor.execute(query)
            if query.strip().upper().startswith("SELECT"):
                results.append(cursor.fetchall())

        connection.commit()
        return jsonify({"status": "success", "results": results})

    except Exception as e:
        # Rollback transaction only if connection exists
        if connection:
            connection.rollback()
        return jsonify({"status": "error", "message": str(e)}), 500

    finally:
        # Safely close cursor and connection if they were initialized
        if cursor:
            cursor.close()
        if connection:
            connection.close()

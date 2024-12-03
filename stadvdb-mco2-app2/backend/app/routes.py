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

def process_transaction(t):
    node = t['node']
    query = t['query']
    isolation_level = t.get('isolation', 'READ COMMITTED')

    connection = None
    cursor = None

    try:
        # Connect to the database for this transaction
        connection = get_db_connection(node)
        cursor = connection.cursor(dictionary=True)

        # Set the isolation level and start the transaction
        cursor.execute(f"SET TRANSACTION ISOLATION LEVEL {isolation_level};")
        cursor.execute("START TRANSACTION;")

        # Execute the query
        cursor.execute(query)
        result = None
        if query.strip().upper().startswith("SELECT"):
            result = cursor.fetchall()

        connection.commit()

        return {
            "transaction_id": t['id'],
            "node": node,
            "query": query,
            "result": result
        }

    except Exception as e:
        # Rollback transaction on error
        if connection:
            connection.rollback()
        return {
            "transaction_id": t['id'],
            "node": node,
            "query": query,
            "error": str(e)
        }

    finally:
        if cursor:
            cursor.close()
        if connection:
            connection.close()

@app.route('/get_combined_records', methods=['GET'])
def get_combined_records():
    page = int(request.args.get('page', 1))
    game_id = request.args.get('game_id', '')

    # Pagination settings
    items_per_page = 10
    offset = (page - 1) * items_per_page

    # Search clause for game_id
    search_clause = f"WHERE game_id = {game_id}" if game_id else ""

    # Query to get total records
    total_records_query = f"""
        SELECT COUNT(*) AS total_records
        FROM (
            SELECT * FROM games_frag1
            {search_clause}
            UNION ALL
            SELECT * FROM games_frag2
            {search_clause}
        ) AS combined_records;
    """

    # Query to get paginated records
    paginated_query = f"""
        SELECT * 
        FROM (
            SELECT * FROM games_frag1
            {search_clause}
            UNION ALL
            SELECT * FROM games_frag2
            {search_clause}
        ) AS combined_records
        LIMIT {items_per_page} OFFSET {offset};
    """

    try:
        connection = get_db_connection("node1")
        cursor = connection.cursor(dictionary=True)

        # Execute total records query
        cursor.execute(total_records_query)
        total_records = cursor.fetchone()["total_records"]

        # Execute paginated query
        cursor.execute(paginated_query)
        records = cursor.fetchall()

        cursor.close()
        connection.close()

        return jsonify({"records": records, "total_records": total_records})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

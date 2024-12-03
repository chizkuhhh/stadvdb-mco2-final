from flask import jsonify, request
from app import app  # Import the app object
from app.db_config import get_db_connection
from concurrent.futures import ThreadPoolExecutor

@app.route('/simulate', methods=['POST'])
def simulate_transactions():
    data = request.json
    transactions = data.get('transactions', [])

    results = []
    errors = []

    # Create a ThreadPoolExecutor for concurrent execution
    with ThreadPoolExecutor() as executor:
        futures = []
        for t in transactions:
            futures.append(executor.submit(process_transaction, t))  # Submit each transaction for processing

        for future in futures:
            result = future.result()  # Wait for each future to complete
            if 'error' in result:
                errors.append(result)
            else:
                results.append(result)

    # Combine results and errors in the response
    return jsonify({
        "status": "success" if not errors else "partial_success",
        "results": results,
        "errors": errors
    })

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

@app.route('/simulate_crash_recovery', methods=['POST'])
def simulate_crash_recovery():
    data = request.json
    simulation_case = data['simulationCase']
    transactions = data['transactions']

    try:
        results = []
        for transaction in transactions:
            node = transaction['node']
            query = transaction['query']
            isolation_level = transaction['isolation']

            # Simulate failure cases
            if simulation_case == 'case1' and node == 'node1':
                raise Exception("Central node (Node 1) is down!")
            elif simulation_case == 'case2' and node in ['node2', 'node3']:
                raise Exception(f"Node {node} is down!")
            elif simulation_case == 'case3' and node != 'node1':
                raise Exception("Replication to central node failed!")
            elif simulation_case == 'case4' and node == 'node1':
                raise Exception("Replication to Node 2 or 3 failed!")

            # Execute the transaction if no failure
            connection = get_db_connection(node)
            cursor = connection.cursor(dictionary=True)
            cursor.execute(f"SET TRANSACTION ISOLATION LEVEL {isolation_level}")
            cursor.execute(query)
            result = cursor.fetchall() if query.strip().upper().startswith("SELECT") else None
            connection.commit()
            results.append({"transaction_id": transaction['id'], "result": result})

        return jsonify({"status": "success", "results": results})

    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500

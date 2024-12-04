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
    

# start of crash & recovery route code
node_states = {
    "node1": "up",  # Central Node
    "node2": "up",  # 1997–2020
    "node3": "up"   # 2021–2025
}

# store pending transactions here
transaction_queue = {
    "node1": [],
    "node2": [],
    "node3": []
}

# helper function to get query year if specified
def extract_year_from_query(query):
    # Example logic to extract year from WHERE clause or VALUES clause in the query
    match = re.search(r"\b(199[7-9]|20[0-2]\d|202[0-5])\b", query)
    return int(match.group()) if match else None

def execute_on_node(node, query):
    connection = get_db_connection(node)
    cursor = connection.cursor(dictionary=True)
    cursor.execute(query)
    result = cursor.fetchall() if query.strip().upper().startswith("SELECT") else None
    connection.commit()
    cursor.close()
    connection.close()
    return result

@app.route('/simulate_crash_recovery', methods=['POST'])
def simulate_crash_recovery():
    data = request.json
    simulation_case = data['simulationCase']
    transactions = data['transactions']

    results = []
    errors = []

    for transaction in transactions:
        node = transaction['node']
        query = transaction['query']
        isolation_level = transaction.get('isolation', 'READ COMMITTED')

        # simulate failure scenarios
        if simulation_case == 'case1' and node == 'node1':
            query = transaction['query'].strip().upper()

            # determine if it's a read or write
            if query.startswith('SELECT'): # read operation
                # run on node 2 and 3 then combine the results
                try:
                    node2_results = execute_on_node('node2', transaction[query])
                    node3_results = execute_on_node('node3', transaction[query])

                    combined_results = node2_results + node3_results

                    results.append({'transaction_id': transaction['id'], 'result': combined_results})
                except Exception as e:
                    errors.append({'transaction_id': transaction['id'], 'error': f'Error executing SELECT query: {str(e)}'})
                continue

            else: # write operation
                if query.startswith('INSERT'):
                    release_year = extract_year_from_query(query)
                    if release_year and 1997 <= release_year <= 2020:
                        transac@app.route('/simulate_crash_recovery', methods=['POST'])
def simulate_crash_recovery():
    data = request.json
    simulation_case = data['simulationCase']
    transactions = data['transactions']

    results = []
    errors = []

    for transaction in transactions:
        node = transaction['node']
        query = transaction['query']
        isolation_level = transaction.get('isolation', 'READ COMMITTED')

        # Simulate failure scenarios
        if simulation_case == 'case1' and node == 'node1':
            query_upper = query.strip().upper()

            # Determine if it's a read or write
            if query_upper.startswith('SELECT'):  # Read operation
                try:
                    if 'games_frag1' in query_upper:
                        # Run on Node 2
                        node2_results = execute_on_node('node2', query)
                        results.append({'transaction_id': transaction['id'], 'result': node2_results})
                    elif 'games_frag2' in query_upper:
                        # Run on Node 3
                        node3_results = execute_on_node('node3', query)
                        results.append({'transaction_id': transaction['id'], 'result': node3_results})
                    else:
                        # Invalid table reference
                        raise Exception("Table not recognized in SELECT query.")

                except Exception as e:
                    errors.append({'transaction_id': transaction['id'], 'error': f'Error executing SELECT query: {str(e)}'})
                continue

            elif query_upper.startswith('INSERT'):  # Write operation (INSERT)
                try:
                    if 'games_frag1' in query_upper:
                        # Run on Node 2
                        execute_on_node('node2', query)
                    elif 'games_frag2' in query_upper:
                        # Run on Node 3
                        execute_on_node('node3', query)
                    else:
                        raise Exception("Table not recognized in INSERT query.")
                except Exception as e:
                    errors.append({'transaction_id': transaction['id'], 'error': f'Error executing INSERT query: {str(e)}'})
                continue

            elif query_upper.startswith(('UPDATE', 'DELETE')):  # Write operation (UPDATE/DELETE)
                try:
                    if 'games_frag1' in query_upper:
                        # Run on Node 2
                        execute_on_node('node2', query)
                    elif 'games_frag2' in query_upper:
                        # Run on Node 3
                        execute_on_node('node3', query)
                    else:
                        raise Exception("Table not recognized in UPDATE/DELETE query.")
                except Exception as e:
                    errors.append({'transaction_id': transaction['id'], 'error': f'Error executing UPDATE/DELETE query: {str(e)}'})

        errors.append({'transaction_id': transaction['id'], 'error': 'Central Node (Node 1) is down!'})

    # Print results to the console
    print("Results:", results)
    print("Errors:", errors)

    # Return a dummy response to avoid TypeError
    return jsonify({"status": "processed", "message": "Results printed to console"})
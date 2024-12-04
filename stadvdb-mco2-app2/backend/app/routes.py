from flask import jsonify, request
from app import app  
from app.db_config import get_db_connection
from concurrent.futures import ProcessPoolExecutor, as_completed
import multiprocessing

multiprocessing.set_start_method('spawn', force=True)

@app.route('/simulate', methods=['POST'])
def simulate_transactions():
    data = request.json
    transactions = data.get('transactions', [])

    results = []
    errors = []

    # for parallel execution of transactions
    with ProcessPoolExecutor() as executor:
        futures = {}
        for t in transactions:
            # submit each transaction for processing in separate processes
            futures[executor.submit(concurrency_transaction, t)] = t

        for future in as_completed(futures):
            result = future.result()  # wait for each future to complete
            transaction = futures[future]
            if 'error' in result:
                errors.append(result)
            else:
                results.append(result)

    # combine results and errors in the response
    return jsonify({
        "status": "success" if not errors else "partial_success",
        "results": results,
        "errors": errors
    })

def concurrency_transaction(t):
    node = t['node']
    query = t['query']
    isolation_level = t.get('isolation', 'READ COMMITTED')
    status = t.get('status', 'COMMIT')
    delay = t.get('delay', 0)

    connection = None
    cursor = None
    result = None

    try:
        connection = get_db_connection(node)
        cursor = connection.cursor(dictionary=True)

        cursor.execute(f"SET TRANSACTION ISOLATION LEVEL {isolation_level};")
        cursor.execute("START TRANSACTION;")

        cursor.execute(query)
        if query.strip().upper().startswith("SELECT"):
            result = cursor.fetchall()

        if delay != '0':
            cursor.execute(f"DO SLEEP({delay});")

        if status == 'COMMIT':
            connection.commit()
        else:
            connection.rollback()

        return {
            "transaction_id": t['id'],
            "node": node,
            "query": query,
            "result": result
        }

    except Exception as e:
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

def process_transaction(t):
    node = t['node']
    query = t['query']
    isolation_level = t.get('isolation', 'READ COMMITTED')

    connection = None
    cursor = None

    try:
        connection = get_db_connection(node)
        cursor = connection.cursor(dictionary=True)

        cursor.execute(f"SET TRANSACTION ISOLATION LEVEL {isolation_level};")
        cursor.execute("START TRANSACTION;")
        
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

    items_per_page = 10
    offset = (page - 1) * items_per_page

    search_clause = f"WHERE game_id = {game_id}" if game_id else ""

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

        cursor.execute(total_records_query)
        total_records = cursor.fetchone()["total_records"]

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
    transactions = data.get('transactions', [])
    node_status = data.get('nodeStatus', {})

    global stashed_transactions
    stashed_transactions = {'node2': [], 'node3': []}

    results = []
    errors = []

    # simulate failure cases
    for t in transactions:
        query = t['query']
        transaction_id = t['id']

        # if central node is down and target node is central node
        if simulation_case == 'case1' and t['node'] == 'node1':
            # Check if the query references 'games_frag1' or 'games_frag2'
            if 'games_frag1' in query:
                node = 'node2'  # Execute on node 2
            elif 'games_frag2' in query:
                node = 'node3'  # Execute on node 3
            else:
                errors.append({
                    "transaction_id": t['id'],
                    "error": "Invalid table reference in query"
                })
                continue

            # Execute the transaction on the correct node
            try:
                result = process_transaction_on_node(t, node)  # Call the modified process function for the right node
                results.append(result)
            except Exception as e:
                errors.append({
                    "transaction_id": t['id'],
                    "error": str(e)
                })

        # if either node 2 or node 3 is down
        elif simulation_case == 'case2':
            target_node = t['node']

            # if node 2 is the target and it's down
            if target_node == 'node2' and not node_status.get('node2', True):

                # if it's a read, then just read from central node
                if query.strip().upper().startswith("SELECT"):
                    try:
                        result = process_transaction_on_node(t, "node1")  # Central node
                        results.append(result)
                    except Exception as e:
                        errors.append({"transaction_id": transaction_id, "error": str(e)})
                
                # if it's a write, then perform it on central node just for viewing purposes
                # stash the transaction, then retry later once the node is turned on again
                else:
                    try:
                        result = process_transaction_on_node(t, "node1")  # Central node
                        results.append(result)
                        stashed_transactions["node2"].append(t)  # Stash the transaction
                    except Exception as e:
                        errors.append({"transaction_id": transaction_id, "error": str(e)})

            # if node 3 is the target and it's down
            elif target_node == 'node3' and not node_status.get('node3', True):

                # if it's a read, then just read from central node
                if query.strip().upper().startswith("SELECT"):
    
                    try:
                        result = process_transaction_on_node(t, "node1")  # Central node
                        results.append(result)
                    except Exception as e:
                        errors.append({"transaction_id": transaction_id, "error": str(e)})

                # if it's a write, then perform it on central node just for viewing purposes
                # stash the transaction, then retry later once the node is turned on again
                else:
                    try:
                        result = process_transaction_on_node(t, "node1")  # Central node
                        results.append(result)
                        stashed_transactions["node3"].append(t)  # Stash the transaction
                    except Exception as e:
                        errors.append({"transaction_id": transaction_id, "error": str(e)})
            else:
                print('else case in case2/4')
                result = process_transaction(t)
                results.append(result)

        else:
            print('going into last else case')
            result = process_transaction(t)
            results.append(result)

    # Return the results and errors
    return jsonify({
        "status": "success" if not errors else "partial_success",
        "results": results,
        "errors": errors,
    })

def process_transaction_on_node(t, node):
    query = t['query']
    isolation_level = t.get('isolation', 'READ COMMITTED')

    connection = None
    cursor = None

    try:
        # connect to the appropriate node (2 or 3)
        connection = get_db_connection(node)
        cursor = connection.cursor(dictionary=True)

        cursor.execute(f"SET TRANSACTION ISOLATION LEVEL {isolation_level};")
        cursor.execute("START TRANSACTION;")

        cursor.execute(query)
        result = None
        if query.strip().upper().startswith("SELECT"):
            result = cursor.fetchall()

        connection.commit()

        return {
            "transaction_id": t['id'],
            "node": node,
            "query": query,
            "result": result,
            "message": f"Query was run on {node}."
        }

    except Exception as e:
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

@app.route('/retry_stashed_transactions', methods=['POST'])
def retry_stashed_transactions():
    retry_results = []
    retry_errors = []

    for node, transactions in stashed_transactions.items():
        for t in transactions[:]:  
            try:
                result = process_transaction(t)
                retry_results.append(result)
                transactions.remove(t) 
            except Exception as e:
                retry_errors.append({"transaction_id": t['id'], "error": str(e)})

    return jsonify({
        "status": "success" if not retry_errors else "partial_success",
        "retry_results": retry_results,
        "retry_errors": retry_errors,
    })

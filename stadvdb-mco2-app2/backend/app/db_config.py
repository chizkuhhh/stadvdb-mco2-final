import mysql.connector

db_config = {
    "node1": {"host": "localhost", "port": 3306, "user": "replication_user", "password": "n3t_@DM1N!", "database": "justgames"}, # change pw into ur own
    "node2": {"host": "localhost", "port": 3307, "user": "replication_user", "password": "n3t_@DM1N!", "database": "justgames"}, # change pw into ur own
    "node3": {"host": "localhost", "port": 3308, "user": "replication_user", "password": "n3t_@DM1N!", "database": "justgames"}  # change pw into ur own
}

def get_db_connection(node):
    return mysql.connector.connect(
        host=db_config[node]["host"],
        port=db_config[node]["port"],  # Include the port
        user=db_config[node]["user"],
        password=db_config[node]["password"],
        database=db_config[node]["database"]
    )

from flask import Flask
from flask_cors import CORS

app = Flask(__name__)  # Create Flask app instance
CORS(app)  # Enable Cross-Origin Resource Sharing (if needed)

# Import routes (must be after app initialization to avoid circular imports)
from app import routes
import sys
import os

# Add the backend folder to the Python path so we can import main
# The path is relative to the api folder in the deployed environment
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'backend'))

from main import app

# Vercel's Python runtime looks for a top-level variable named 'app' (for ASGI) or 'handler'.
# FastAPI's 'app' is an ASGI application, so we can expose it directly.
# The @vercel/python runtime will automatically wrap it.
# No need for Mangum here, Vercel's runtime handles the ASGI interface.

# If you have a specific reason to use Mangum, uncomment the lines below and use 'handler'.
# from mangum import Mangum
# handler = Mangum(app)
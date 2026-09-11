# api/index.py
import sys
import os
# Add the backend folder to path so we can import main
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'backend'))

from main import app
from mangum import Mangum

# The handler for Vercel
handler = Mangum(app)
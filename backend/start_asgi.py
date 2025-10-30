# api/index.py - This wraps your FastAPI app for Vercel
import sys
from pathlib import Path

# Add backend to path so we can import it
sys.path.insert(0, str(Path(__file__).parent.parent / "backend"))

from mangum import Mangum
from backend.app.api import app

# Mangum wraps FastAPI ASGI app for AWS Lambda/Vercel
handler = Mangum(app, lifespan="off")


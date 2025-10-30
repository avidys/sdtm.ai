import asyncio
import json

from typing import Optional

from fastapi import FastAPI, UploadFile, File as FastAPIFile
from fastapi.middleware.cors import CORSMiddleware
from sse_starlette.sse import EventSourceResponse
import pandas as pd
import io

from .sensor import SensorData
#from .parsers import parseDatasetFile
# TODO $HOST in origin and endpoints

app = FastAPI()
sensor = SensorData()


# Minimal placeholder parser until a real implementation is provided
def parse_dataset_file(file: str) -> dict:
    """Return a simple structure acknowledging the requested file.

    This is a stub to avoid NameError. Replace with real parsing logic
    (e.g., reading CSV/Parquet and returning structured data) as needed.
    """

    data = file.read()  # Your XPT file data in bytes
    buffer = io.BytesIO(data)
    df = pd.read_sas(buffer, format='xport')
    return {"file": file, "status": "parsed", "data": df.to_dict()}


# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=['*'],  # Svelte dev server
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api")
async def root():
    return {"message": "Welcome to the Sensor Dashboard API"}


@app.get("/api/current")
async def get_current_reading():
    """Get the current sensor reading."""
    return sensor.generate_reading()


@app.get("/api/stream")
async def stream_data():
    """Stream sensor data using server-sent events."""
    async def event_generator():
        while True:
            data = sensor.generate_reading()
            yield {
                "event": "sensor_update",
                "data": json.dumps(data)
            }
            await asyncio.sleep(2)  # Update every 2 seconds

    return EventSourceResponse(event_generator())

@app.get("/api/items/{item_id}")
def read_item(item_id: int, q: Optional[str] = None):
    return {"item_id": item_id, "q": q}


@app.get("/api/data")
def get_data():
    print("Python API was hit successfully!")
    
    # This is the data that will be sent back to the SvelteKit load function
    return {"message": "Hello from your FastAPI backend!", "value": 123}

@app.post("/api/parse")
async def parse_dataset_upload(file: UploadFile = FastAPIFile(...)) -> dict:
    """Accept a file upload (e.g., XPT) and return parsed content.

    For large files or heavy parsing, consider persisting to a temp file:
    - Use tempfile.NamedTemporaryFile(delete=False) for a unique path
    - Stream parse to avoid loading all into memory
    """
    print(f"Python API was hit successfully! Parsing uploaded dataset: {file.filename}")
    data = await file.read()
    buffer = io.BytesIO(data)
    df = pd.read_sas(buffer, format='xport')
    print(f"Parsed dataset: {df.to_dict()}")
    return {"file": file.filename, "status": "parsed", "data": df.to_dict()}

   
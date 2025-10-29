import asyncio
import json

from typing import Optional

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sse_starlette.sse import EventSourceResponse

from .sensor import SensorData

# TODO $HOST in origin and endpoints

app = FastAPI()
sensor = SensorData()


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
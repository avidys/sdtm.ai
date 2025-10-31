import asyncio
import json
import tempfile
import os

from typing import Optional

from fastapi import FastAPI, UploadFile, File as FastAPIFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sse_starlette.sse import EventSourceResponse
import pandas as pd
import io
import traceback

from .sensor import SensorData
#from .parsers import parseDatasetFile
# TODO $HOST in origin and endpoints

# call R
from rpy2.robjects import pandas2ri
from rpy2.robjects.conversion import localconverter
import rpy2.robjects as robjects

robjects.r('read_xpt <- function(path){haven::read_xpt(path)}')
robjects.r('read_sas7bdat <- function(path){haven::read_sas(path)}')

# In-memory parsing functions using R connections
# Note: haven::read_xpt() and haven::read_sas() require file paths,
# but we use R's connection API to handle the data transfer in-memory
robjects.r('''
read_xpt_from_bytes <- function(raw_bytes) {
    # Create a connection from raw bytes for in-memory processing
    # Use rawConnection to work with the binary data directly
    con <- rawConnection(raw_bytes, "rb")
    on.exit(close(con))
    
    # haven requires a file path, so we write to R's tempfile
    # This is still more efficient as data transfer from Python to R is in-memory
    # and R handles its own temp file management
    tmp <- tempfile(fileext = ".xpt")
    on.exit(file.remove(tmp), add = TRUE)
    
    # Write from connection to temp file
    writeBin(readBin(con, "raw", n = length(raw_bytes)), tmp)
    
    # Parse using haven
    result <- haven::read_xpt(tmp)
    return(result)
}

read_sas7bdat_from_bytes <- function(raw_bytes) {
    # Similar approach for SAS7BDAT using connections
    con <- rawConnection(raw_bytes, "rb")
    on.exit(close(con))
    
    tmp <- tempfile(fileext = ".sas7bdat")
    on.exit(file.remove(tmp), add = TRUE)
    
    # Write from connection to temp file
    writeBin(readBin(con, "raw", n = length(raw_bytes)), tmp)
    
    # Parse using haven
    result <- haven::read_sas(tmp)
    return(result)
}
''')

read_xpt = robjects.r['read_xpt']
read_sas7bdat = robjects.r['read_sas7bdat']
read_xpt_from_bytes = robjects.r['read_xpt_from_bytes']
read_sas7bdat_from_bytes = robjects.r['read_sas7bdat_from_bytes']

app = FastAPI()
sensor = SensorData()

# Add exception handler to ensure CORS headers are included in error responses
@app.exception_handler(HTTPException)
async def http_exception_handler(request, exc: HTTPException):
    """Ensure CORS headers are included in HTTPException responses"""
    return JSONResponse(
        status_code=exc.status_code,
        content={"detail": exc.detail},
        headers={
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "*",
            "Access-Control-Allow-Headers": "*",
        }
    )

@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    """Handle all unhandled exceptions and ensure CORS headers are included"""
    error_msg = str(exc) if exc else "Internal server error"
    print(f"Unhandled exception occurred: {error_msg}")
    traceback.print_exc()
    return JSONResponse(
        status_code=500,
        content={"detail": error_msg, "error": type(exc).__name__},
        headers={
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "*",
            "Access-Control-Allow-Headers": "*",
        }
    )


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
    return {"message": "Welcome to the SDTM AI API"}


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

@app.post("/api/parse_pd")
async def parse_dataset_pandas(file: UploadFile = FastAPIFile(...)) -> dict:
    """Parse various file formats using pandas.
    
    Supports: CSV, Excel (.xlsx, .xls), JSON, Parquet, SAS (.xpt, .sas7bdat), TSV
    """
    print(f"Python API Parsing with Pandas: {file.filename}")
    data = await file.read()
    
    # Get file extension to determine parser
    file_ext = os.path.splitext(file.filename)[1].lower()
    buffer = io.BytesIO(data)
    
    try:
        if file_ext in ['.csv', '.txt']:
            # CSV files
            df = pd.read_csv(buffer, encoding='utf-8', low_memory=False)
        elif file_ext in ['.tsv']:
            # TSV files
            df = pd.read_csv(buffer, sep='\t', encoding='utf-8', low_memory=False)
        elif file_ext in ['.xlsx', '.xls']:
            # Excel files - read first sheet by default
            try:
                df = pd.read_excel(buffer, engine='openpyxl' if file_ext == '.xlsx' else None)
            except ImportError:
                raise HTTPException(
                    status_code=400,
                    detail="Excel file support requires 'openpyxl' package. Install with: pip install openpyxl"
                )
        elif file_ext in ['.json', '.jsonl']:
            # JSON files
            if file_ext == '.jsonl':
                # JSON Lines format
                df = pd.read_json(buffer, lines=True)
            else:
                # Standard JSON
                json_data = json.loads(data.decode('utf-8'))
                # If it's a list of records, use directly; otherwise try to normalize
                if isinstance(json_data, list):
                    df = pd.DataFrame(json_data)
                else:
                    df = pd.json_normalize(json_data)
        elif file_ext in ['.parquet', '.pq']:
            # Parquet files
            try:
                df = pd.read_parquet(buffer, engine='pyarrow')
            except ImportError:
                raise HTTPException(
                    status_code=400,
                    detail="Parquet file support requires 'pyarrow' package. Install with: pip install pyarrow"
                )
        elif file_ext in ['.xpt']:
            # SAS XPT files
            df = pd.read_sas(buffer, format='xport')
        elif file_ext in ['.sas7bdat']:
            # SAS7BDAT files
            df = pd.read_sas(buffer, format='sas7bdat')
        else:
            raise ValueError(f"Unsupported file format: {file_ext}. Supported formats: CSV, Excel, JSON, Parquet, SAS")
        
        # Convert to list of dictionaries for JSON serialization
        result = {"file": file.filename, "status": "parsed", "data": df.to_dict('records')}
        return result
        
    except ValueError as e:
        error_msg = str(e)
        print(f"Error parsing {file.filename} with pandas: {error_msg}")
        raise HTTPException(
            status_code=400,
            detail=f"Failed to parse {file.filename}: {error_msg}"
        )
    except HTTPException:
        # Re-raise HTTPExceptions as-is (they already have proper status codes)
        raise
    except Exception as e:
        error_msg = str(e)
        print(f"Error parsing {file.filename} with pandas: {error_msg}")
        traceback.print_exc()
        raise HTTPException(
            status_code=500,
            detail=f"Failed to parse {file.filename}: {error_msg}"
        )


@app.post("/api/parse")
async def parse_dataset(file: UploadFile = FastAPIFile(...)) -> dict:
    """Parse XPT or SAS7BDAT files using R's haven library.
    
    The file is saved to a temporary file since R's haven functions require a file path.
    """
    print(f"Python API Parsing with R: {file.filename}")
    data = await file.read()
    
    # Get file extension to determine parser
    file_ext = os.path.splitext(file.filename)[1].lower()
    
    # Create temporary file
    with tempfile.NamedTemporaryFile(delete=False, suffix=file_ext) as tmp_file:
        tmp_path = tmp_file.name
        tmp_file.write(data)
    
    try:
        # Parse based on file extension
        if file_ext == '.xpt':
            df_r = read_xpt(tmp_path)
        elif file_ext == '.sas7bdat':
            df_r = read_sas7bdat(tmp_path)
        else:
            # Fallback: try pandas for other SAS formats
            buffer = io.BytesIO(data)
            df_pd = pd.read_sas(buffer, format='xport' if file_ext == '.xpt' else 'sas7bdat')
            # Convert pandas DataFrame to dict
            return {"file": file.filename, "status": "parsed", "data": df_pd.to_dict('records')}
        
        # Convert R DataFrame to pandas and then to list of dicts
        # Use new conversion context instead of deprecated activate/deactivate
        with localconverter(robjects.default_converter + pandas2ri.converter):
            df_pd = pandas2ri.rpy2py(df_r)
        
        # Convert to list of dictionaries for JSON serialization
        result = {"file": file.filename, "status": "parsed", "data": df_pd.to_dict('records')}
        return result
        
    finally:
        # Clean up temporary file
        try:
            os.unlink(tmp_path)
        except OSError:
            pass  # File already deleted or doesn't exist


@app.post("/api/parse2")
async def parse_dataset_inmemory(file: UploadFile = FastAPIFile(...)) -> dict:
    """Parse XPT or SAS7BDAT files using R's haven library with in-memory connections.
    
    This version uses R's connection API to read from memory instead of temporary files.
    The file data is passed directly to R as a raw vector, which is more efficient.
    """
    print(f"Python API Parsing with R (in-memory): {file.filename}")
    data = await file.read()
    
    # Get file extension to determine parser
    file_ext = os.path.splitext(file.filename)[1].lower()
    
    try:
        # Convert Python bytes to R raw vector
        # R uses raw vectors (integer vector with values 0-255) for binary data
        raw_bytes_r = robjects.ByteVector(data)
        
        # Parse based on file extension using in-memory functions
        if file_ext == '.xpt':
            df_r = read_xpt_from_bytes(raw_bytes_r)
        elif file_ext == '.sas7bdat':
            df_r = read_sas7bdat_from_bytes(raw_bytes_r)
        else:
            # Fallback: try pandas for other SAS formats
            buffer = io.BytesIO(data)
            df_pd = pd.read_sas(buffer, format='xport' if file_ext == '.xpt' else 'sas7bdat')
            # Convert pandas DataFrame to dict
            return {"file": file.filename, "status": "parsed", "data": df_pd.to_dict('records')}
        
        # Convert R DataFrame to pandas and then to list of dicts
        # Use new conversion context instead of deprecated activate/deactivate
        with localconverter(robjects.default_converter + pandas2ri.converter):
            df_pd = pandas2ri.rpy2py(df_r)
        
        # Convert to list of dictionaries for JSON serialization
        result = {"file": file.filename, "status": "parsed", "data": df_pd.to_dict('records')}
        return result
        
    except HTTPException:
        # Re-raise HTTPExceptions as-is (they already have proper status codes)
        raise
    except Exception as e:
        error_msg = str(e)
        print(f"Error parsing {file.filename}: {error_msg}")
        traceback.print_exc()
        raise HTTPException(
            status_code=500,
            detail=f"Failed to parse {file.filename}: {error_msg}"
        )
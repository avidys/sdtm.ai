from fastapi import FastAPI

app = FastAPI()

# A public root for the API
@app.get("/api")
def api_root():
    return {"status": "FastAPI is running"}


@app.get("/api/data")
def get_data():
    print("Python API was hit successfully!")
    
    # This is the data that will be sent back to the SvelteKit load function
    return {"message": "Hello from your FastAPI backend!", "value": 123}

    
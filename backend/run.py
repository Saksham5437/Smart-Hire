import uvicorn

if __name__ == "__main__":
    # This block safely wraps the reloader process for Windows
    uvicorn.run("app.main:app", host="127.0.0.1", port=8000, reload=True)
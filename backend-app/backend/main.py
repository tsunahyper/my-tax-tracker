import logging
import sys
import os

# Add the current directory to Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse
from mangum import Mangum
from starlette.middleware.sessions import SessionMiddleware

from src.config import SECRET_KEY
from src.routers.auth import auth_router
from src.routers.receipts import receipts_router

logger = logging.getLogger()
logger.setLevel(logging.INFO)


app = FastAPI()

app.add_middleware(
    SessionMiddleware,
    secret_key=SECRET_KEY,
    same_site="lax",
    https_only=False,
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.include_router(auth_router)
app.include_router(receipts_router)


@app.get("/", response_class=HTMLResponse)
async def root():
    """Root endpoint"""
    return """
    <div style="font-family: Arial, sans-serif; text-align: center; margin-top: 50px;">
        <h1>My Tax Tracker API</h1>
        <p>Welcome to the API!</p>
        <p><a href="/docs">API Documentation</a></p>
        <p><a href="/health">Health Check</a></p>
    </div>
    """


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "environment": "dev"}


@app.get("/api/v1/users")
async def get_users():
    """Get users endpoint"""
    return {"message": "Get Users!", "users": []}


@app.get("/api/v1/posts")
async def get_posts():
    """Get posts endpoint"""
    return {"message": "Get Posts!", "posts": []}


# Create Mangum handler for AWS Lambda
handler = Mangum(app, lifespan="off")

import os
from datetime import datetime, timedelta, timezone
from typing import Dict

import boto3
import httpx
from authlib.integrations.starlette_client import OAuth
from dotenv import load_dotenv
from fastapi import HTTPException, Request, status
from jose import jwt

load_dotenv()

# Set defaults for missing environment variables
CLIENT_SECRET = os.getenv("CLIENT_SECRET", "")
CLIENT_ID = os.getenv("CLIENT_ID", "")
COGNITO_REGION = os.getenv("COGNITO_REGION", "ap-southeast-1")
COGNITO_USER_POOL_ID = os.getenv("COGNITO_USER_POOL_ID", "")
SECRET_KEY = os.getenv("SECRET_KEY", "dev-secret-key-change-in-production")
AWS_ACCESS_KEY_ID = os.getenv("AWS_ACCESS_KEY_ID", "")
AWS_SECRET_ACCESS_KEY = os.getenv("AWS_SECRET_ACCESS_KEY", "")
AWS_DEFAULT_REGION = os.getenv("AWS_DEFAULT_REGION", "ap-southeast-1")
RECEIPT_TABLE = os.getenv("RECEIPT_TABLE", "")
BLACKLIST_TOKEN_TABLE = os.getenv("BLACKLIST_TOKEN_TABLE", "")
S3_BUCKET = os.getenv("S3_BUCKET", "")
REDIRECT_URI = os.getenv("REDIRECT_URI", "")
ALLOW_ORIGINS = os.getenv("ALLOW_ORIGINS", "*")

# Handle ALLOW_ORIGIN parsing safely
if ALLOW_ORIGINS and ALLOW_ORIGINS != "*":
    ALLOW_ORIGIN = [origin.strip() for origin in ALLOW_ORIGINS.split(",") if origin.strip()]
else:
    ALLOW_ORIGIN = ["*"]

# Initialize variables
oauth = None
SERVER_METADATA_URL = None
JWKS_URL = None
COGNITO_ISSUER = None

# Only set up OAuth if required variables are present
if CLIENT_ID and COGNITO_USER_POOL_ID:
    SERVER_METADATA_URL = f"https://cognito-idp.{COGNITO_REGION}.amazonaws.com/{COGNITO_USER_POOL_ID}/.well-known/openid-configuration"
    JWKS_URL = f"https://cognito-idp.{COGNITO_REGION}.amazonaws.com/{COGNITO_USER_POOL_ID}/.well-known/jwks.json"
    COGNITO_ISSUER = f"https://cognito-idp.{COGNITO_REGION}.amazonaws.com/{COGNITO_USER_POOL_ID}"

    oauth = OAuth()
    oauth.register(
        name="oidc",
        authority=COGNITO_ISSUER,
        client_id=CLIENT_ID,
        client_secret=CLIENT_SECRET,
        server_metadata_url=SERVER_METADATA_URL,
        client_kwargs={"scope": "email openid phone profile"},
    )

# Cache JWKS
_jwks = None

async def get_jwks():
    global _jwks
    if not JWKS_URL:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Cognito configuration not set up",
        )
    if _jwks is None:
        async with httpx.AsyncClient() as client:
            resp = await client.get(JWKS_URL)
            resp.raise_for_status()
            _jwks = resp.json()
    return _jwks

async def verify_cognito_jwt(token: str) -> Dict:
    """Verifies a Cognito JWT token using the fetched JWKS."""
    if not CLIENT_ID or not COGNITO_USER_POOL_ID:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Cognito configuration not set up",
        )
    try:
        jwks = await get_jwks()
        headers = jwt.get_unverified_headers(token)
        kid = headers.get("kid")
        if not kid:
            raise ValueError("Token missing 'kid' header.")

        key = next((k for k in jwks["keys"] if k["kid"] == kid), None)
        if not key:
            raise ValueError("Public key not found for the given 'kid'.")

        payload = jwt.decode(
            token,
            key,
            algorithms=["RS256"],  # Cognito typically uses RS256
            audience=CLIENT_ID,
            issuer=COGNITO_ISSUER,
        )
        return payload
    except Exception as e:
        print(f"JWT verification failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Token validation error: {e}",
        )

async def get_current_user(request: Request):
    auth = request.headers.get("Authorization")
    token = None
    if auth and auth.startswith("Bearer "):
        token = auth.split(" ")[1]
    if not token:
        token = request.cookies.get("access_token")
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated. Missing Access Token.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    if await is_token_blacklisted(token):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token has expired. Please log in again.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return await verify_cognito_jwt(token)

async def get_current_user_profile(request: Request):
    id_token = request.cookies.get("id_token")
    if not id_token:
        raise HTTPException(status_code=401, detail="No ID token found")
    decoded = jwt.decode(
        id_token,
        key="",  # type: ignore
        options={
            "verify_signature": False,
            "verify_aud": False,
            "verify_at_hash": False,
        },
    )
    return decoded

async def blacklist_token(token: str, expires_in: int = 3600, token_type: str = "access"):
    try:
        decoded = jwt.get_unverified_claims(token)
        jti = decoded.get("jti", token)
        exp = decoded.get("exp")
        if exp:
            expires_at = int(exp)
        else:
            expires_at = int((datetime.now(timezone.utc) + timedelta(seconds=expires_in)).timestamp())
        logout_time = datetime.now(timezone.utc).isoformat()
        
        # Only try to blacklist if we have a valid table
        if blacklist_token_db:
            blacklist_token_db.put_item(
                Item={
                    "token_jti": jti,
                    "logout_time": logout_time,
                    "expires_at": expires_at,
                    "token_type": token_type,
                }
            )
    except Exception as e:
        print(f"Failed to blacklist token: {e}")

async def is_token_blacklisted(token: str, token_type: str = None):
    try:
        decoded = jwt.get_unverified_claims(token)
        jti = decoded.get("jti", token)
        
        # Only check blacklist if we have a valid table
        if blacklist_token_db:
            response = blacklist_token_db.query(
                KeyConditionExpression="token_jti = :jti",
                ExpressionAttributeValues={":jti": jti},
            )
            items = response.get("Items", [])
            if not items:
                return False
            if token_type:
                return any(item.get("token_type") == token_type for item in items)
            return True
        return False
    except Exception as e:
        print(f"Failed to check blacklist: {e}")
        return False

async def validate_refresh_token(token: str):
    # This should verify the refresh token (signature, expiry, etc.)
    try:
        payload = await verify_cognito_jwt(token)
        # Optionally, check for token_use == "refresh"
        if payload.get("token_use") != "refresh":
            return None
        return payload
    except Exception as e:
        print(f"Refresh token validation failed: {e}")
        return None

async def generate_new_tokens(refresh_token: str):
    """
    Generate new tokens using Cognito's token endpoint with a refresh token.
    """
    if not oauth:
        return None, None
    
    try:
        new_token_data = await oauth.oidc.fetch_access_token(
            grant_type="refresh_token",
            refresh_token=refresh_token,
        )
        new_access_token = new_token_data.get("access_token")
        # Cognito refresh token rotation is a setting on the user pool client.
        # If a new one is issued, it will be in the response. If not, the old one is still valid to be used again.
        new_refresh_token = new_token_data.get("refresh_token", refresh_token)
        return new_access_token, new_refresh_token
    except Exception as e:
        print(f"Failed to generate new tokens: {e}")
        return None, None

# Initialize AWS resources only if credentials are provided
s3 = None
receipt_bucket = None
dynamo = None
receipt_db = None
blacklist_token_db = None
receipt_textract = None

if AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY and S3_BUCKET:
    try:
        s3 = boto3.resource(
            "s3",
            aws_access_key_id=AWS_ACCESS_KEY_ID,
            aws_secret_access_key=AWS_SECRET_ACCESS_KEY,
            region_name=AWS_DEFAULT_REGION,
        )
        receipt_bucket = s3.Bucket(str(S3_BUCKET))
    except Exception as e:
        print(f"Failed to initialize S3: {e}")

if AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY and RECEIPT_TABLE:
    try:
        dynamo = boto3.resource(
            "dynamodb",
            aws_access_key_id=AWS_ACCESS_KEY_ID,
            aws_secret_access_key=AWS_SECRET_ACCESS_KEY,
            region_name=AWS_DEFAULT_REGION,
        )
        receipt_db = dynamo.Table(str(RECEIPT_TABLE))
        blacklist_token_db = dynamo.Table(str(BLACKLIST_TOKEN_TABLE))
    except Exception as e:
        print(f"Failed to initialize DynamoDB: {e}")

if AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY:
    try:
        receipt_textract = boto3.client(
            "textract",
            aws_access_key_id=AWS_ACCESS_KEY_ID,
            aws_secret_access_key=AWS_SECRET_ACCESS_KEY,
            region_name=AWS_DEFAULT_REGION,
        )
    except Exception as e:
        print(f"Failed to initialize Textract: {e}")

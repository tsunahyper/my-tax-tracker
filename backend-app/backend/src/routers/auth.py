from fastapi import APIRouter, Depends, Request
from fastapi.responses import JSONResponse, RedirectResponse

from src.config import (
    REDIRECT_URI,
    blacklist_token,
    generate_new_tokens,
    get_current_user_profile,
    is_token_blacklisted,
    oauth,
)

auth_router = APIRouter(prefix="/auth")


@auth_router.get("/login")
async def login(request: Request):
    redirect_uri = request.url_for("authorize")
    return await oauth.oidc.authorize_redirect(request, redirect_uri)


@auth_router.get("/authorize")
async def authorize(request: Request):
    token = await oauth.oidc.authorize_access_token(request)
    # Set tokens in HTTP-only cookies
    response = RedirectResponse(url=REDIRECT_URI)
    response.set_cookie("id_token", token.get("id_token"), httponly=True, secure=False)
    response.set_cookie("access_token", token.get("access_token"), httponly=True, secure=False)
    response.set_cookie("refresh_token", token.get("refresh_token"), httponly=True, secure=False)
    return response


@auth_router.get("/logout")
async def logout(request: Request):
    access_token = request.cookies.get("access_token")
    refresh_token = request.cookies.get("refresh_token")
    if access_token:
        await blacklist_token(access_token, token_type="access")
    if refresh_token:
        await blacklist_token(refresh_token, token_type="refresh")

    response = RedirectResponse(url="/")
    response.delete_cookie("refresh_token")
    response.delete_cookie("access_token")
    response.delete_cookie("id_token")
    return response


@auth_router.post("/refresh")
async def refresh_token(request: Request):
    refresh_token = request.cookies.get("refresh_token")
    if not refresh_token:
        return JSONResponse({"error": "No refresh token provided"}, status_code=401)

    if await is_token_blacklisted(refresh_token, token_type="refresh"):
        return JSONResponse({"error": "Refresh token is blacklisted"}, status_code=401)

    new_access_token, new_refresh_token = await generate_new_tokens(refresh_token)

    if not new_access_token:
        return JSONResponse({"error": "Failed to refresh token"}, status_code=401)

    await blacklist_token(refresh_token, token_type="refresh")

    response = JSONResponse({"message": "Token refreshed", "access_token": new_access_token})
    response.set_cookie("access_token", new_access_token, httponly=True, secure=False)
    response.set_cookie("refresh_token", new_refresh_token, httponly=True, secure=False)
    return response


@auth_router.get("/me")
async def get_me(user=Depends(get_current_user_profile)):
    return JSONResponse(
        {
            "username": user.get("cognito:username") or user.get("email") or user.get("sub"),
            "phone_number": user.get("phone_number"),
            "email": user.get("email"),
            "gender": user.get("gender"),
        }
    )

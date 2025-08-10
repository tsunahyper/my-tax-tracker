Malaysian Tax Tracker – Backend (FastAPI)
=========================================

Overview
--------

This backend is a FastAPI application designed for a Malaysian Tax Tracker project. It provides robust integration with various AWS services to handle authentication, file storage, data management, and intelligent data extraction. The backend is specifically built to seamlessly integrate with a React frontend using OpenID Connect (OIDC) authentication.

Features
--------

*   **Authentication:** Secure user authentication and authorization using AWS Cognito Hosted UI (OIDC).

*   **Token Management:** Handles Access and Refresh Tokens, storing them securely in HTTP-only cookies. Implements JWT blacklisting on logout for enhanced security.

*   **Receipt Upload:** Allows users to upload receipt images, which are then securely stored in an AWS S3 bucket.

*   **Data Extraction:** Leverages AWS Textract for Optical Character Recognition (OCR) to extract relevant data from uploaded receipts.

*   **Data Storage:** Extracted receipt data and other metadata are efficiently stored in AWS DynamoDB tables.

*   **Frontend Integration:** Configured with Cross-Origin Resource Sharing (CORS) to enable smooth communication with a Single Page Application (SPA) React frontend.

*   **Environment Management:** Utilizes .env files for flexible configuration, with clear precedence rules for environment variables.


Setup Instructions
------------------

To get the backend running, follow these steps:

### 1\. Environment Variables

Create a .env file in your backend's root directory and populate it with the following variables. **Remember to replace the placeholder values with your actual AWS Cognito and S3 details.**

```
CLIENT_ID=""
CLIENT_SECRET="" # Leave empty if you are using a public client (common for web/mobile apps)
REDIRECT_URI="http://localhost:8000/auth/authorize" # Must match your Cognito App Client's "Allowed callback URLs"
COGNITO_REGION="ap-southeast-5" # Your AWS region, e.g., us-east-1, ap-southeast-1
COGNITO_USER_POOL_ID=""
COGNITO_HOSTED_UI_DOMAIN="https://.auth..amazoncognito.com" # Your Cognito Hosted UI domain
SECRET_KEY="" # Use: python -c "import os; print(os.urandom(32).hex())"
S3_BUCKET_NAME="your_s3_bucket_name"
```
**Note:**

*   Always use the **Cognito Hosted UI domain** for the COGNITO\_HOSTED\_UI\_DOMAIN variable, as this is where users are redirected for login/authorization. Do not use the cognito-idp endpoint here.

*   Environment variables set directly in your shell will override values defined in the .env file.


### 2\. AWS Resources

Ensure the following AWS resources are set up in your AWS account:

*   **Cognito User Pool:**

    *   Enable and configure the Hosted UI.

    *   Set "Allowed callback URLs" to http://localhost:8000/auth/authorize.

    *   Set "Allowed logout URLs" to http://localhost:8000/.

    *   Enable "Authorization code grant" flow.

    *   Select necessary OAuth Scopes: openid, email, profile, phone, offline\_access.

*   **DynamoDB Tables:**

    *   RECEIPT\_TABLE: For storing extracted receipt data.

        *   **Partition Key:** receipt\_id (String)

    *   my-blacklist-token: For JWT blacklisting.

        *   **Partition Key:** token\_jti (String)

        *   **Sort Key:** logout\_time (String)

        *   **TTL Attribute:** expires\_at (Number) - This attribute should be configured in DynamoDB to automatically expire old entries.

*   **S3 Bucket:**

    *   A dedicated S3 bucket for storing uploaded receipt images. The name should match S3\_BUCKET\_NAME in your .env.

*   **Textract:**

    *   Ensure AWS Textract is enabled and configured for OCR operations on your receipts.


### 3\. Install Dependencies

Navigate to your backend's root directory and install the required Python packages (requirements.txt):

```
 fastapi
 uvicorn
 python-dotenv
 authlib
 python-jose[cryptography]
 httpx
 boto3
 ```

 Then you will need to run the command below to install all the dependencies listed in the 'requirements.txt':

 `pip install -r requirements.txt`

### 4\. Run the Application

Start the FastAPI application using Uvicorn:

  `uvicorn main:app --reload --host 0.0.0.0 --port 8000`

This command will run the server on http://localhost:8000 and automatically reload on code changes.

Authentication Flow
-------------------

1.  **User Initiates Login:** When a user accesses a protected web page or clicks a login link, they are redirected to the Cognito Hosted UI for authentication.

2.  **Cognito Authentication:** The user logs in via Cognito.

3.  **Token Issuance:** Upon successful authentication, Cognito redirects the user back to your backend's /auth/authorize endpoint.

4.  **Token Storage:** The backend receives the ID Token, Access Token, and Refresh Token. These tokens are then securely stored as **HTTP-only cookies** in the user's browser.

5.  **Protected Endpoints:** All protected API endpoints (and web pages) utilize the get\_current\_user FastAPI dependency. This dependency performs the following checks:

    *   It extracts the Access Token from either the Authorization header (for direct API calls, e.g., from Postman or a mobile app) or from the access\_token HTTP-only cookie (for web page requests).

    *   It verifies the JWT's signature, expiration, audience, and issuer against Cognito's public keys.

    *   **Crucially, it checks the my-blacklist-token DynamoDB table to ensure the token has not been explicitly revoked.**


JWT Blacklisting (Logout Security)
----------------------------------

To enhance security and provide immediate "logout" for API sessions:

*   **On Logout:** When a user initiates a logout (/auth/logout), the backend performs two key actions:

    1.  It clears all authentication-related HTTP-only cookies from the user's browser.

    2.  It sends a request to AWS Cognito to **revoke the user's Refresh Token**. This prevents the user from obtaining new Access Tokens using that Refresh Token.

    3.  The ID of the Access Token (JTI claim) is added to the my-blacklist-token DynamoDB table with a TTL (Time-To-Live) attribute set to the Access Token's expiration time.

*   **Token Validation:** The get\_current\_user dependency, used by all protected endpoints, will always check this my-blacklist-token table. If an Access Token's ID is found in the blacklist, the request is immediately rejected with a 401 Unauthorized error, even if the token hasn't technically expired yet.

*   **DynamoDB TTL:** DynamoDB's TTL feature automatically deletes expired blacklisted tokens, keeping the table clean and efficient.


Receipt Upload and Textract
---------------------------

The /receipts/upload endpoint handles the receipt processing:

1.  **File Upload:** The endpoint receives an uploaded receipt image file.

2.  **S3 Storage:** The file is then uploaded and stored in the configured AWS S3 bucket.

3.  **Textract Processing:** AWS Textract is invoked to perform OCR on the uploaded receipt image, extracting key data fields.

4.  **DynamoDB Storage:** The extracted data from Textract, along with relevant metadata, is then stored in the RECEIPT\_TABLE in DynamoDB.


Frontend Integration
--------------------

*   **CORS:** The FastAPI backend is configured with appropriate CORS headers to allow requests from your React Single Page Application (SPA) frontend.

*   **OIDC Client:** The React frontend should use an OIDC client library (e.g., react-oidc-context or oidc-client-ts) to handle the authentication flow with Cognito's Hosted UI. It will then pass the Access Token in the Authorization: Bearer header for protected API calls to this backend.


Troubleshooting & Lessons Learned
---------------------------------

*   **Cognito Region/Domain Consistency:**

    *   Always use the **Cognito Hosted UI domain** (e.g., https://your-domain.auth.region.amazoncognito.com) for the COGNITO\_HOSTED\_UI\_DOMAIN environment variable, which is used for the user-facing login/authorization redirects.

    *   The **Cognito IDP endpoint** (e.g., https://cognito-idp.region.amazonaws.com/user\_pool\_id) is the OIDC issuer and is used for JWT verification and metadata discovery. Ensure COGNITO\_DOMAIN in config.py (derived from COGNITO\_REGION and COGNITO\_USER\_POOL\_ID) matches this format.

    *   While the IDP endpoint might _seem_ to work for direct login in some regions, it's not the officially supported method for user authentication via the Hosted UI and can lead to unexpected failures.

*   **Environment Variables Precedence:**

    *   Be aware that shell environment variables take precedence over values defined in your .env file.

    *   To debug, use printenv (on Mac/Linux) or inspect os.environ within your Python code to see the active environment variables.

*   **DynamoDB Key Schema:**

    *   When working with DynamoDB tables that have both a partition key and a sort key, you **must** provide both keys when using get\_item to retrieve a specific item.

    *   To query for items based only on the partition key (or a subset of attributes), use the query operation instead of get\_item.

    *   Ensure you use plain Python values when interacting with boto3 for keys (e.g., {'token\_jti': 'some\_id'}), not the DynamoDB JSON format ({'token\_jti': {'S': 'some\_id'}}).

*   **JWT Blacklisting:**

    *   It is crucial to implement a check against the blacklist table (my-blacklist-token) on **every protected endpoint** to ensure revoked tokens are rejected.

    *   Leverage DynamoDB's TTL feature to automatically expire and remove old, blacklisted tokens, preventing the table from growing indefinitely.

*   **Textract Limitations:**

    *   The accuracy of data extraction from receipts using Textract is highly dependent on the image quality, clarity of text, and the specific format of the receipt. Be prepared for potential parsing errors and implement robust error handling and potentially manual review steps.


Useful Commands
---------------

*   `printenv`

*   `uvicorn main:app --reload --host 0.0.0.0 --port 8000`


References
----------

*   [AWS Cognito Hosted UI Docs](https://docs.aws.amazon.com/cognito/latest/developerguide/cognito-user-pools-app-integration.html)

*   [FastAPI Docs](https://fastapi.tiangolo.com/)

*   [Boto3 Docs](https://boto3.amazonaws.com/v1/documentation/api/latest/index.html)

*   [AWS Textract Docs](https://docs.aws.amazon.com/textract/latest/dg/what-is.html)

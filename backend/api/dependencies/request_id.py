from uuid import uuid4
from fastapi import Request

REQUEST_ID_HEADER = "X-Request-ID"

def get_request_id(request: Request) -> str:
    incoming = request.headers.get(REQUEST_ID_HEADER)
    return incoming if incoming else str(uuid4())
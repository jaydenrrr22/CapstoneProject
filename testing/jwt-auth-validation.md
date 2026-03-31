# JWT Authentication Validation

These checks verify strict JWT enforcement behavior.

## Prerequisites

Set environment variables:

- `BASE_URL` (example: `http://localhost:8000`)
- valid user credentials for `/auth/login`

## 1) Valid login returns JWT

```bash
curl -s -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"StrongPass123"}'
```

Expected:

- `200 OK`
- JSON includes `access_token`
- JSON includes `token_type` set to `bearer`

## 2) Valid token accesses protected route

```bash
TOKEN=$(curl -s -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"StrongPass123"}' | jq -r '.access_token')

curl -i -X GET "$BASE_URL/health" \
  -H "Authorization: Bearer $TOKEN"
```

Expected:

- `200 OK`
- Health payload is returned

## 3) Missing token fails with 401

```bash
curl -i -X GET "$BASE_URL/health"
```

Expected:

- `401 Unauthorized`
- JSON detail indicates authentication failure

## 4) Invalid token fails with 401

```bash
curl -i -X GET "$BASE_URL/health" \
  -H "Authorization: Bearer invalid.token.value"
```

Expected:

- `401 Unauthorized`
- JSON detail indicates invalid token

## 5) Expired token fails with 401

Use a previously issued token after expiry (default 60 minutes), then run:

```bash
curl -i -X GET "$BASE_URL/health" \
  -H "Authorization: Bearer $EXPIRED_TOKEN"
```

Expected:

- `401 Unauthorized`
- JSON detail indicates expired token

## Additional route smoke checks

Use the same valid token to confirm other protected endpoints are enforced:

- `GET /transaction/get`
- `GET /budget/get`
- `POST /predict/`
- `GET /prediction/history`

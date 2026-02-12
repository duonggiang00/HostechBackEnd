# API Documentation - Property Management System

## Base URL

```
http://localhost:8000
```

## Authentication

### For Protected API Endpoints (v1)

After obtaining a Sanctum bearer token from authentication endpoints, include it in the Authorization header:

```
Authorization: Bearer {token}
X-Org-Id: {org_id}
```

All v1 API requests require the organization ID to be passed as a header (except for auth endpoints):

```
X-Org-Id: {org_id}
```

---

## Authentication Endpoints (`/api/auth`)

### Register User

**POST** `/api/auth/register`

Request Body:

```json
{
    "full_name": "John Doe",
    "email": "john.doe@company.com",
    "phone": "+1-555-0123",
    "password": "secure_password_123",
    "password_confirmation": "secure_password_123"
}
```

**Example Request:**

```bash
curl -X POST "http://localhost:8000/api/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "full_name": "John Doe",
    "email": "john.doe@company.com",
    "phone": "+1-555-0123",
    "password": "12345678",
    "password_confirmation": "12345678"
  }'
```

**Response (201 Created):**

```json
{
    "user": {
        "id": "550e8400-e29b-41d4-a716-446655440000",
        "full_name": "John Doe",
        "email": "john.doe@company.com",
        "phone": "+1-555-0123",
        "roles": ["Tenant"]
    },
    "token": "1|abcDefGhIjKlMnOpQrStUvWxYz..."
}
```

### Login

**POST** `/api/auth/login`

Request Body:

```json
{
    "email": "john.doe@company.com",
    "password": "12345678"
}
```

**Example Request:**

```bash
curl -X POST "http://localhost:8000/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john.doe@company.com",
    "password": "12345678"
  }'
```

**Response (200 OK):**

```json
{
    "user": {
        "id": "550e8400-e29b-41d4-a716-446655440000",
        "full_name": "John Doe",
        "email": "john.doe@company.com",
        "phone": "+1-555-0123",
        "roles": ["Tenant"]
    },
    "token": "1|abcDefGhIjKlMnOpQrStUvWxYz..."
}
```

### Logout

**POST** `/api/auth/logout`

**Headers:**

```
Authorization: Bearer {token}
```

**Example Request:**

```bash
curl -X POST "http://localhost:8000/api/auth/logout" \
  -H "Authorization: Bearer 1|abcDefGhIjKlMnOpQrStUvWxYz..."
```

**Response (200 OK):**

```json
{
    "message": "Logged out successfully"
}
```

### Request Password Reset

**POST** `/api/auth/forgot-password`

Request Body:

```json
{
    "email": "john.doe@company.com"
}
```

**Example Request:**

```bash
curl -X POST "http://localhost:8000/api/auth/forgot-password" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john.doe@company.com"
  }'
```

**Response (200 OK):**

```json
{
    "status": "We have emailed your password reset link!"
}
```

### Reset Password

**POST** `/api/auth/reset-password`

Request Body:

```json
{
    "email": "john.doe@company.com",
    "password": "new_password_123",
    "password_confirmation": "new_password_123",
    "token": "reset_token_from_email"
}
```

**Example Request:**

```bash
curl -X POST "http://localhost:8000/api/auth/reset-password" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john.doe@company.com",
    "password": "new_password_456",
    "password_confirmation": "new_password_456",
    "token": "abc123def456..."
  }'
```

**Response (200 OK):**

```json
{
    "status": "Your password has been reset!"
}
```

### Update User Profile Information

**PUT** `/api/auth/user/profile-information`

**Headers:**

```
Authorization: Bearer {token}
X-Org-Id: {org_id}
```

Request Body (all fields optional):

```json
{
    "full_name": "Jane Doe",
    "email": "jane.doe@company.com",
    "phone": "+1-555-0456"
}
```

**Example Request:**

```bash
curl -X PUT "http://localhost:8000/api/auth/user/profile-information" \
  -H "Authorization: Bearer 1|abcDefGhIjKlMnOpQrStUvWxYz..." \
  -H "Content-Type: application/json" \
  -d '{
    "full_name": "Jane Doe",
    "email": "jane.doe@company.com",
    "phone": "+1-555-0456"
  }'
```

**Response (200 OK):**

```json
{
    "message": "Profile updated successfully"
}
```

### Update User Password

**PUT** `/api/auth/user/password`

**Headers:**

```
Authorization: Bearer {token}
```

Request Body:

```json
{
    "current_password": "old_password",
    "password": "new_password_123",
    "password_confirmation": "new_password_123"
}
```

**Example Request:**

```bash
curl -X PUT "http://localhost:8000/api/auth/user/password" \
  -H "Authorization: Bearer 1|abcDefGhIjKlMnOpQrStUvWxYz..." \
  -H "Content-Type: application/json" \
  -d '{
    "current_password": "12345678",
    "password": "new_password_789",
    "password_confirmation": "new_password_789"
  }'
```

**Response (200 OK):**

```json
{
    "message": "Password updated successfully"
}
```

### Enable Two-Factor Authentication

**POST** `/api/auth/user/two-factor-authentication`

**Headers:**

```
Authorization: Bearer {token}
```

**Example Request:**

```bash
curl -X POST "http://localhost:8000/api/auth/user/two-factor-authentication" \
  -H "Authorization: Bearer 1|abcDefGhIjKlMnOpQrStUvWxYz..."
```

**Response (200 OK):**

```json
{
    "two_factor_secret": "JBSWY3DPEBLW64TMMQ======",
    "qr_code": "data:image/svg+xml;base64,..."
}
```

### Get Two-Factor QR Code

**GET** `/api/auth/user/two-factor-qr-code`

**Headers:**

```
Authorization: Bearer {token}
```

**Example Request:**

```bash
curl -X GET "http://localhost:8000/api/auth/user/two-factor-qr-code" \
  -H "Authorization: Bearer 1|abcDefGhIjKlMnOpQrStUvWxYz..."
```

**Response (200 OK):**

```json
{
    "svg": "<svg>...</svg>"
}
```

### Confirm Two-Factor Authentication

**POST** `/api/auth/user/confirmed-two-factor-authentication`

**Headers:**

```
Authorization: Bearer {token}
Content-Type: application/json
```

Request Body:

```json
{
    "code": "123456"
}
```

**Example Request:**

```bash
curl -X POST "http://localhost:8000/api/auth/user/confirmed-two-factor-authentication" \
  -H "Authorization: Bearer 1|abcDefGhIjKlMnOpQrStUvWxYz..." \
  -H "Content-Type: application/json" \
  -d '{
    "code": "123456"
  }'
```

**Response (200 OK):**

```json
{
    "status": "success",
    "recovery_codes": ["code1-code1", "code2-code2", ...]
}
```

### Get Two-Factor Recovery Codes

**GET** `/api/auth/user/two-factor-recovery-codes`

**Headers:**

```
Authorization: Bearer {token}
```

**Example Request:**

```bash
curl -X GET "http://localhost:8000/api/auth/user/two-factor-recovery-codes" \
  -H "Authorization: Bearer 1|abcDefGhIjKlMnOpQrStUvWxYz..."
```

**Response (200 OK):**

```json
{
    "data": ["code1-code1", "code2-code2", ...]
}
```

### Regenerate Two-Factor Recovery Codes

**POST** `/api/auth/user/two-factor-recovery-codes`

**Headers:**

```
Authorization: Bearer {token}
```

**Example Request:**

```bash
curl -X POST "http://localhost:8000/api/auth/user/two-factor-recovery-codes" \
  -H "Authorization: Bearer 1|abcDefGhIjKlMnOpQrStUvWxYz..."
```

**Response (200 OK):**

```json
{
    "data": ["new-code1-code1", "new-code2-code2", ...]
}
```

### Disable Two-Factor Authentication

**DELETE** `/api/auth/user/two-factor-authentication`

**Headers:**

```
Authorization: Bearer {token}
```

Request Body:

```json
{
    "password": "user_password"
}
```

**Example Request:**

```bash
curl -X DELETE "http://localhost:8000/api/auth/user/two-factor-authentication" \
  -H "Authorization: Bearer 1|abcDefGhIjKlMnOpQrStUvWxYz..." \
  -H "Content-Type: application/json" \
  -d '{
    "password": "12345678"
  }'
```

**Response (200 OK):**

```json
{
    "status": "success"
}
```

---

## Organizations Endpoint (`/api/v1/orgs`)

### List Organizations

**GET** `/api/v1/orgs`

Query Parameters:

- `per_page` (integer, optional): Items per page (default: 15, max: 100)
- `page` (integer, optional): Page number (default: 1)

**Example Request:**

```bash
curl -X GET "http://localhost:8000/api/v1/orgs?per_page=10" \
  -H "Authorization: Bearer {token}"
```

**Response (200 OK):**

```json
{
    "data": [
        {
            "id": "550e8400-e29b-41d4-a716-446655440000",
            "name": "Acme Corporation",
            "phone": "+1-555-0123",
            "email": "contact@acme.com",
            "address": "123 Business Ave",
            "timezone": "UTC",
            "currency": "USD",
            "created_at": "2026-02-11T10:00:00Z",
            "updated_at": "2026-02-11T10:00:00Z"
        }
    ],
    "links": {
        "first": "http://localhost:8000/api/v1/orgs?page=1",
        "last": "http://localhost:8000/api/v1/orgs?page=1",
        "prev": null,
        "next": null
    },
    "meta": {
        "current_page": 1,
        "from": 1,
        "last_page": 1,
        "per_page": 10,
        "to": 1,
        "total": 1
    }
}
```

### Get Organization by ID

**GET** `/api/v1/orgs/{id}`

**Headers:**

```
Authorization: Bearer {token}
```

**Example Request:**

```bash
curl -X GET "http://localhost:8000/api/v1/orgs/550e8400-e29b-41d4-a716-446655440000" \
  -H "Authorization: Bearer {token}"
```

**Response (200 OK):**

```json
{
    "data": {
        "id": "550e8400-e29b-41d4-a716-446655440000",
        "name": "Acme Corporation",
        "phone": "+1-555-0123",
        "email": "contact@acme.com",
        "address": "123 Business Ave",
        "timezone": "UTC",
        "currency": "USD",
        "created_at": "2026-02-11T10:00:00Z",
        "updated_at": "2026-02-11T10:00:00Z"
    }
}
```

### Create Organization

**POST** `/api/v1/orgs`

**Headers:**

```
Authorization: Bearer {token}
Content-Type: application/json
```

Request Body:

```json
{
    "name": "New Company",
    "phone": "+1-555-0123",
    "email": "contact@newcompany.com",
    "address": "456 Enterprise St",
    "timezone": "UTC",
    "currency": "USD"
}
```

**Example Request:**

```bash
curl -X POST "http://localhost:8000/api/v1/orgs" \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "New Company",
    "phone": "+1-555-0123",
    "email": "contact@newcompany.com",
    "address": "456 Enterprise St",
    "timezone": "UTC",
    "currency": "USD"
  }'
```

**Response (201 Created):**

```json
{
    "data": {
        "id": "660e8400-e29b-41d4-a716-446655440001",
        "name": "New Company",
        "phone": "+1-555-0123",
        "email": "contact@newcompany.com",
        "address": "456 Enterprise St",
        "timezone": "UTC",
        "currency": "USD",
        "created_at": "2026-02-11T11:00:00Z",
        "updated_at": "2026-02-11T11:00:00Z"
    }
}
```

### Update Organization

**PUT/PATCH** `/api/v1/orgs/{id}`

**Headers:**

```
Authorization: Bearer {token}
Content-Type: application/json
```

Request Body (all fields optional):

```json
{
    "name": "Updated Company Name",
    "timezone": "America/New_York"
}
```

**Example Request:**

```bash
curl -X PATCH "http://localhost:8000/api/v1/orgs/550e8400-e29b-41d4-a716-446655440000" \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Updated Company Name",
    "timezone": "America/New_York"
  }'
```

**Response (200 OK):**

```json
{
    "data": {
        "id": "550e8400-e29b-41d4-a716-446655440000",
        "name": "Updated Company Name",
        "phone": "+1-555-0123",
        "email": "contact@acme.com",
        "address": "123 Business Ave",
        "timezone": "America/New_York",
        "currency": "USD",
        "created_at": "2026-02-11T10:00:00Z",
        "updated_at": "2026-02-11T11:30:00Z"
    }
}
```

### Delete Organization

**DELETE** `/api/v1/orgs/{id}`

**Headers:**

```
Authorization: Bearer {token}
```

**Example Request:**

```bash
curl -X DELETE "http://localhost:8000/api/v1/orgs/550e8400-e29b-41d4-a716-446655440000" \
  -H "Authorization: Bearer {token}"
```

**Response (204 No Content)**

---

## Users Endpoint (`/api/v1/users`)

### List Users

**GET** `/api/v1/users`

Query Parameters:

- `per_page` (integer, optional): Items per page (default: 15, max: 100)
- `page` (integer, optional): Page number (default: 1)
- `filter[email]` (string, optional): Filter by email address
- `filter[is_active]` (boolean, optional): Filter by active status

**Headers:**

```
Authorization: Bearer {token}
X-Org-Id: {org_id}
```

**Example Request:**

```bash
curl -X GET "http://localhost:8000/api/v1/users?per_page=10" \
  -H "Authorization: Bearer {token}" \
  -H "X-Org-Id: 550e8400-e29b-41d4-a716-446655440000"
```

**Response (200 OK):**

```json
{
    "data": [
        {
            "id": "770e8400-e29b-41d4-a716-446655440002",
            "org_id": "550e8400-e29b-41d4-a716-446655440000",
            "full_name": "John Doe",
            "phone": "+1-555-0789",
            "email": "john.doe@company.com",
            "email_verified_at": "2026-02-10T10:00:00Z",
            "is_active": true,
            "mfa_enabled": false,
            "last_login_at": "2026-02-11T09:00:00Z",
            "roles": ["Staff"],
            "created_at": "2026-02-01T10:00:00Z",
            "updated_at": "2026-02-11T10:00:00Z"
        }
    ],
    "links": {
        "first": "http://localhost:8000/api/v1/users?page=1",
        "last": "http://localhost:8000/api/v1/users?page=1",
        "prev": null,
        "next": null
    },
    "meta": {
        "current_page": 1,
        "from": 1,
        "last_page": 1,
        "per_page": 10,
        "to": 1,
        "total": 1
    }
}
```

### Get User by ID

**GET** `/api/v1/users/{id}`

**Headers:**

```
Authorization: Bearer {token}
X-Org-Id: {org_id}
```

**Example Request:**

```bash
curl -X GET "http://localhost:8000/api/v1/users/770e8400-e29b-41d4-a716-446655440002" \
  -H "Authorization: Bearer {token}" \
  -H "X-Org-Id: 550e8400-e29b-41d4-a716-446655440000"
```

**Response (200 OK):**

```json
{
    "data": {
        "id": "770e8400-e29b-41d4-a716-446655440002",
        "org_id": "550e8400-e29b-41d4-a716-446655440000",
        "full_name": "John Doe",
        "phone": "+1-555-0789",
        "email": "john.doe@company.com",
        "email_verified_at": "2026-02-10T10:00:00Z",
        "is_active": true,
        "mfa_enabled": false,
        "last_login_at": "2026-02-11T09:00:00Z",
        "roles": ["Staff"],
        "created_at": "2026-02-01T10:00:00Z",
        "updated_at": "2026-02-11T10:00:00Z"
    }
}
```

### Create User

**POST** `/api/v1/users`

**Headers:**

```
Authorization: Bearer {token}
X-Org-Id: {org_id}
Content-Type: application/json
```

Request Body:

```json
{
    "full_name": "Jane Smith",
    "phone": "+1-555-0321",
    "email": "jane.smith@company.com",
    "password": "12345678",
    "password_confirmation": "12345678",
    "is_active": true
}
```

**Example Request:**

```bash
curl -X POST "http://localhost:8000/api/v1/users" \
  -H "Authorization: Bearer {token}" \
  -H "X-Org-Id: 550e8400-e29b-41d4-a716-446655440000" \
  -H "Content-Type: application/json" \
  -d '{
    "full_name": "Jane Smith",
    "phone": "+1-555-0321",
    "email": "jane.smith@company.com",
    "password": "12345678",
    "password_confirmation": "12345678",
    "is_active": true
  }'
```

**Response (201 Created):**

```json
{
    "data": {
        "id": "880e8400-e29b-41d4-a716-446655440003",
        "org_id": "550e8400-e29b-41d4-a716-446655440000",
        "full_name": "Jane Smith",
        "phone": "+1-555-0321",
        "email": "jane.smith@company.com",
        "email_verified_at": null,
        "is_active": true,
        "mfa_enabled": false,
        "last_login_at": null,
        "roles": ["Tenant"],
        "created_at": "2026-02-11T11:00:00Z",
        "updated_at": "2026-02-11T11:00:00Z"
    }
}
```

### Update User

**PUT/PATCH** `/api/v1/users/{id}`

**Headers:**

```
Authorization: Bearer {token}
X-Org-Id: {org_id}
Content-Type: application/json
```

Request Body (all fields optional):

```json
{
    "full_name": "Jane Doe Smith",
    "phone": "+1-555-0654"
}
```

**Example Request:**

```bash
curl -X PATCH "http://localhost:8000/api/v1/users/880e8400-e29b-41d4-a716-446655440003" \
  -H "Authorization: Bearer {token}" \
  -H "X-Org-Id: 550e8400-e29b-41d4-a716-446655440000" \
  -H "Content-Type: application/json" \
  -d '{
    "full_name": "Jane Doe Smith",
    "phone": "+1-555-0654"
  }'
```

**Response (200 OK):**

```json
{
    "data": {
        "id": "880e8400-e29b-41d4-a716-446655440003",
        "org_id": "550e8400-e29b-41d4-a716-446655440000",
        "full_name": "Jane Doe Smith",
        "phone": "+1-555-0654",
        "email": "jane.smith@company.com",
        "email_verified_at": null,
        "is_active": true,
        "mfa_enabled": false,
        "last_login_at": null,
        "roles": ["Tenant"],
        "created_at": "2026-02-11T11:00:00Z",
        "updated_at": "2026-02-11T11:30:00Z"
    }
}
```

### Delete User

**DELETE** `/api/v1/users/{id}`

**Headers:**

```
Authorization: Bearer {token}
X-Org-Id: {org_id}
```

**Example Request:**

```bash
curl -X DELETE "http://localhost:8000/api/v1/users/880e8400-e29b-41d4-a716-446655440003" \
  -H "Authorization: Bearer {token}" \
  -H "X-Org-Id: 550e8400-e29b-41d4-a716-446655440000"
```

**Response (204 No Content)**

---

## Properties Endpoint (`/api/v1/properties`)

### List Properties

**GET** `/api/v1/properties`

Query Parameters:

- `per_page` (integer, optional): Items per page (default: 15, max: 100)
- `page` (integer, optional): Page number (default: 1)
- `filter[name]` (string, optional): Filter by property name
- `filter[code]` (string, optional): Filter by property code
- `sort` (string, optional): Sort by field (e.g., `name`, `-name` for descending)

**Headers:**

```
Authorization: Bearer {token}
X-Org-Id: {org_id}
```

**Example Request:**

```bash
curl -X GET "http://localhost:8000/api/v1/properties?per_page=10&filter[name]=Main" \
  -H "Authorization: Bearer {token}" \
  -H "X-Org-Id: 550e8400-e29b-41d4-a716-446655440000"
```

**Response (200 OK):**

```json
{
    "data": [
        {
            "id": "990e8400-e29b-41d4-a716-446655440004",
            "code": "PROP-ABC",
            "name": "Main Property",
            "address": "123 Main St",
            "note": "Primary location",
            "use_floors": true,
            "default_billing_cycle": "MONTHLY",
            "default_due_day": 5,
            "default_cutoff_day": 30,
            "bank_accounts": null,
            "created_at": "2026-02-11T10:00:00Z",
            "updated_at": "2026-02-11T10:00:00Z"
        }
    ],
    "links": {
        "first": "http://localhost:8000/api/v1/properties?page=1",
        "last": "http://localhost:8000/api/v1/properties?page=1",
        "prev": null,
        "next": null
    },
    "meta": {
        "current_page": 1,
        "from": 1,
        "last_page": 1,
        "per_page": 10,
        "to": 1,
        "total": 1
    }
}
```

### Get Property by ID

**GET** `/api/v1/properties/{id}`

**Headers:**

```
Authorization: Bearer {token}
X-Org-Id: {org_id}
```

**Example Request:**

```bash
curl -X GET "http://localhost:8000/api/v1/properties/990e8400-e29b-41d4-a716-446655440004" \
  -H "Authorization: Bearer {token}" \
  -H "X-Org-Id: 550e8400-e29b-41d4-a716-446655440000"
```

**Response (200 OK):**

```json
{
    "data": {
        "id": "990e8400-e29b-41d4-a716-446655440004",
        "code": "PROP-ABC",
        "name": "Main Property",
        "address": "123 Main St",
        "note": "Primary location",
        "use_floors": true,
        "default_billing_cycle": "MONTHLY",
        "default_due_day": 5,
        "default_cutoff_day": 30,
        "bank_accounts": null,
        "created_at": "2026-02-11T10:00:00Z",
        "updated_at": "2026-02-11T10:00:00Z"
    }
}
```

### Create Property

**POST** `/api/v1/properties`

**Headers:**

```
Authorization: Bearer {token}
X-Org-Id: {org_id}
Content-Type: application/json
```

Request Body:

```json
{
    "code": "PROP-XYZ",
    "name": "New Property",
    "address": "456 New St",
    "use_floors": true,
    "default_billing_cycle": "MONTHLY",
    "default_due_day": 1,
    "default_cutoff_day": 25
}
```

**Example Request:**

```bash
curl -X POST "http://localhost:8000/api/v1/properties" \
  -H "Authorization: Bearer {token}" \
  -H "X-Org-Id: 550e8400-e29b-41d4-a716-446655440000" \
  -H "Content-Type: application/json" \
  -d '{
    "code": "PROP-XYZ",
    "name": "New Property",
    "address": "456 New St",
    "use_floors": true,
    "default_billing_cycle": "MONTHLY",
    "default_due_day": 1,
    "default_cutoff_day": 25
  }'
```

**Response (201 Created):**

```json
{
    "data": {
        "id": "aa0e8400-e29b-41d4-a716-446655440005",
        "code": "PROP-XYZ",
        "name": "New Property",
        "address": "456 New St",
        "note": null,
        "use_floors": true,
        "default_billing_cycle": "MONTHLY",
        "default_due_day": 1,
        "default_cutoff_day": 25,
        "bank_accounts": null,
        "created_at": "2026-02-11T11:00:00Z",
        "updated_at": "2026-02-11T11:00:00Z"
    }
}
```

### Update Property

**PUT/PATCH** `/api/v1/properties/{id}`

**Headers:**

```
Authorization: Bearer {token}
X-Org-Id: {org_id}
Content-Type: application/json
```

Request Body (all fields optional):

```json
{
    "name": "Updated Property Name",
    "default_due_day": 10
}
```

**Example Request:**

```bash
curl -X PATCH "http://localhost:8000/api/v1/properties/990e8400-e29b-41d4-a716-446655440004" \
  -H "Authorization: Bearer {token}" \
  -H "X-Org-Id: 550e8400-e29b-41d4-a716-446655440000" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Updated Property Name",
    "default_due_day": 10
  }'
```

**Response (200 OK):**

```json
{
    "data": {
        "id": "990e8400-e29b-41d4-a716-446655440004",
        "code": "PROP-ABC",
        "name": "Updated Property Name",
        "address": "123 Main St",
        "note": "Primary location",
        "use_floors": true,
        "default_billing_cycle": "MONTHLY",
        "default_due_day": 10,
        "default_cutoff_day": 30,
        "bank_accounts": null,
        "created_at": "2026-02-11T10:00:00Z",
        "updated_at": "2026-02-11T11:30:00Z"
    }
}
```

### Delete Property

**DELETE** `/api/v1/properties/{id}`

**Headers:**

```
Authorization: Bearer {token}
X-Org-Id: {org_id}
```

**Example Request:**

```bash
curl -X DELETE "http://localhost:8000/api/v1/properties/990e8400-e29b-41d4-a716-446655440004" \
  -H "Authorization: Bearer {token}" \
  -H "X-Org-Id: 550e8400-e29b-41d4-a716-446655440000"
```

**Response (204 No Content)**

---

## Floors Endpoint (`/api/v1/floors`)

### List Floors

**GET** `/api/v1/floors`

Query Parameters:

- `per_page` (integer, optional): Items per page (default: 15, max: 100)
- `page` (integer, optional): Page number (default: 1)
- `filter[property_id]` (UUID, optional): Filter by property ID
- `sort` (string, optional): Sort by field (e.g., `sort_order`, `-sort_order`)

**Headers:**

```
Authorization: Bearer {token}
X-Org-Id: {org_id}
```

**Example Request:**

```bash
curl -X GET "http://localhost:8000/api/v1/floors?per_page=20&filter[property_id]=990e8400-e29b-41d4-a716-446655440004" \
  -H "Authorization: Bearer {token}" \
  -H "X-Org-Id: 550e8400-e29b-41d4-a716-446655440000"
```

**Response (200 OK):**

```json
{
    "data": [
        {
            "id": "bb0e8400-e29b-41d4-a716-446655440006",
            "property_id": "990e8400-e29b-41d4-a716-446655440004",
            "code": "F1",
            "name": "First Floor",
            "sort_order": 1,
            "created_at": "2026-02-11T10:00:00Z",
            "updated_at": "2026-02-11T10:00:00Z"
        }
    ],
    "links": {
        "first": "http://localhost:8000/api/v1/floors?page=1",
        "last": "http://localhost:8000/api/v1/floors?page=1",
        "prev": null,
        "next": null
    },
    "meta": {
        "current_page": 1,
        "from": 1,
        "last_page": 1,
        "per_page": 20,
        "to": 1,
        "total": 1
    }
}
```

### Get Floor by ID

**GET** `/api/v1/floors/{id}`

**Headers:**

```
Authorization: Bearer {token}
X-Org-Id: {org_id}
```

**Example Request:**

```bash
curl -X GET "http://localhost:8000/api/v1/floors/bb0e8400-e29b-41d4-a716-446655440006" \
  -H "Authorization: Bearer {token}" \
  -H "X-Org-Id: 550e8400-e29b-41d4-a716-446655440000"
```

**Response (200 OK):**

```json
{
    "data": {
        "id": "bb0e8400-e29b-41d4-a716-446655440006",
        "property_id": "990e8400-e29b-41d4-a716-446655440004",
        "code": "F1",
        "name": "First Floor",
        "sort_order": 1,
        "created_at": "2026-02-11T10:00:00Z",
        "updated_at": "2026-02-11T10:00:00Z"
    }
}
```

### Create Floor

**POST** `/api/v1/floors`

**Headers:**

```
Authorization: Bearer {token}
X-Org-Id: {org_id}
Content-Type: application/json
```

Request Body:

```json
{
    "property_id": "990e8400-e29b-41d4-a716-446655440004",
    "code": "F2",
    "name": "Second Floor",
    "sort_order": 2
}
```

**Example Request:**

```bash
curl -X POST "http://localhost:8000/api/v1/floors" \
  -H "Authorization: Bearer {token}" \
  -H "X-Org-Id: 550e8400-e29b-41d4-a716-446655440000" \
  -H "Content-Type: application/json" \
  -d '{
    "property_id": "990e8400-e29b-41d4-a716-446655440004",
    "code": "F2",
    "name": "Second Floor",
    "sort_order": 2
  }'
```

**Response (201 Created):**

```json
{
    "data": {
        "id": "cc0e8400-e29b-41d4-a716-446655440007",
        "property_id": "990e8400-e29b-41d4-a716-446655440004",
        "code": "F2",
        "name": "Second Floor",
        "sort_order": 2,
        "created_at": "2026-02-11T11:00:00Z",
        "updated_at": "2026-02-11T11:00:00Z"
    }
}
```

### Update Floor

**PUT/PATCH** `/api/v1/floors/{id}`

**Headers:**

```
Authorization: Bearer {token}
X-Org-Id: {org_id}
Content-Type: application/json
```

Request Body (all fields optional):

```json
{
    "name": "Updated Floor Name",
    "sort_order": 3
}
```

**Example Request:**

```bash
curl -X PATCH "http://localhost:8000/api/v1/floors/bb0e8400-e29b-41d4-a716-446655440006" \
  -H "Authorization: Bearer {token}" \
  -H "X-Org-Id: 550e8400-e29b-41d4-a716-446655440000" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Updated Floor Name",
    "sort_order": 3
  }'
```

**Response (200 OK):**

```json
{
    "data": {
        "id": "bb0e8400-e29b-41d4-a716-446655440006",
        "property_id": "990e8400-e29b-41d4-a716-446655440004",
        "code": "F1",
        "name": "Updated Floor Name",
        "sort_order": 3,
        "created_at": "2026-02-11T10:00:00Z",
        "updated_at": "2026-02-11T11:30:00Z"
    }
}
```

### Delete Floor

**DELETE** `/api/v1/floors/{id}`

**Headers:**

```
Authorization: Bearer {token}
X-Org-Id: {org_id}
```

**Example Request:**

```bash
curl -X DELETE "http://localhost:8000/api/v1/floors/bb0e8400-e29b-41d4-a716-446655440006" \
  -H "Authorization: Bearer {token}" \
  -H "X-Org-Id: 550e8400-e29b-41d4-a716-446655440000"
```

**Response (204 No Content)**

---

## Rooms Endpoint (`/api/v1/rooms`)

### List Rooms

**GET** `/api/v1/rooms`

Query Parameters:

- `per_page` (integer, optional): Items per page (default: 15, max: 100)
- `page` (integer, optional): Page number (default: 1)
- `filter[code]` (string, optional): Filter by room code
- `filter[status]` (string, optional): Filter by status (available, occupied, maintenance, reserved)
- `filter[type]` (string, optional): Filter by type (studio, apartment, house, dormitory, other)
- `filter[property_id]` (UUID, optional): Filter by property ID
- `sort` (string, optional): Sort by field (e.g., `code`, `-code`, `base_price`)

**Headers:**

```
Authorization: Bearer {token}
X-Org-Id: {org_id}
```

**Example Request:**

```bash
curl -X GET "http://localhost:8000/api/v1/rooms?per_page=20&filter[status]=available&filter[property_id]=990e8400-e29b-41d4-a716-446655440004" \
  -H "Authorization: Bearer {token}" \
  -H "X-Org-Id: 550e8400-e29b-41d4-a716-446655440000"
```

**Response (200 OK):**

```json
{
    "data": [
        {
            "id": "dd0e8400-e29b-41d4-a716-446655440008",
            "code": "A101",
            "name": "Room A101",
            "type": "apartment",
            "area": 35.5,
            "floor": 1,
            "capacity": 2,
            "base_price": "5000000.00",
            "status": "available",
            "description": "Spacious apartment with balcony",
            "amenities": ["WiFi", "AC", "TV"],
            "utilities": ["Electricity", "Water"],
            "created_at": "2026-02-11T10:00:00Z",
            "updated_at": "2026-02-11T10:00:00Z"
        }
    ],
    "links": {
        "first": "http://localhost:8000/api/v1/rooms?page=1",
        "last": "http://localhost:8000/api/v1/rooms?page=1",
        "prev": null,
        "next": null
    },
    "meta": {
        "current_page": 1,
        "from": 1,
        "last_page": 1,
        "per_page": 20,
        "to": 1,
        "total": 1
    }
}
```

### Get Room by ID

**GET** `/api/v1/rooms/{id}`

**Headers:**

```
Authorization: Bearer {token}
X-Org-Id: {org_id}
```

**Example Request:**

```bash
curl -X GET "http://localhost:8000/api/v1/rooms/dd0e8400-e29b-41d4-a716-446655440008" \
  -H "Authorization: Bearer {token}" \
  -H "X-Org-Id: 550e8400-e29b-41d4-a716-446655440000"
```

**Response (200 OK):**

```json
{
    "data": {
        "id": "dd0e8400-e29b-41d4-a716-446655440008",
        "code": "A101",
        "name": "Room A101",
        "type": "apartment",
        "area": 35.5,
        "floor": 1,
        "capacity": 2,
        "base_price": "5000000.00",
        "status": "available",
        "description": "Spacious apartment with balcony",
        "amenities": ["WiFi", "AC", "TV"],
        "utilities": ["Electricity", "Water"],
        "created_at": "2026-02-11T10:00:00Z",
        "updated_at": "2026-02-11T10:00:00Z"
    }
}
```

### Create Room

**POST** `/api/v1/rooms`

**Headers:**

```
Authorization: Bearer {token}
X-Org-Id: {org_id}
Content-Type: application/json
```

Request Body:

```json
{
    "code": "B202",
    "name": "Room B202",
    "type": "studio",
    "area": 25.0,
    "floor": 2,
    "capacity": 1,
    "base_price": "3500000.00",
    "status": "available",
    "description": "Cozy studio room",
    "property_id": "990e8400-e29b-41d4-a716-446655440004",
    "amenities": ["WiFi", "AC"],
    "utilities": ["Electricity", "Water"]
}
```

**Example Request:**

```bash
curl -X POST "http://localhost:8000/api/v1/rooms" \
  -H "Authorization: Bearer {token}" \
  -H "X-Org-Id: 550e8400-e29b-41d4-a716-446655440000" \
  -H "Content-Type: application/json" \
  -d '{
    "code": "B202",
    "name": "Room B202",
    "type": "studio",
    "area": 25.0,
    "floor": 2,
    "capacity": 1,
    "base_price": "3500000.00",
    "status": "available",
    "description": "Cozy studio room",
    "property_id": "990e8400-e29b-41d4-a716-446655440004",
    "amenities": ["WiFi", "AC"],
    "utilities": ["Electricity", "Water"]
  }'
```

**Response (201 Created):**

```json
{
    "data": {
        "id": "ee0e8400-e29b-41d4-a716-446655440009",
        "code": "B202",
        "name": "Room B202",
        "type": "studio",
        "area": 25.0,
        "floor": 2,
        "capacity": 1,
        "base_price": "3500000.00",
        "status": "available",
        "description": "Cozy studio room",
        "amenities": ["WiFi", "AC"],
        "utilities": ["Electricity", "Water"],
        "created_at": "2026-02-11T11:00:00Z",
        "updated_at": "2026-02-11T11:00:00Z"
    }
}
```

### Update Room

**PUT/PATCH** `/api/v1/rooms/{id}`

**Headers:**

```
Authorization: Bearer {token}
X-Org-Id: {org_id}
Content-Type: application/json
```

Request Body (all fields optional):

```json
{
    "status": "maintenance",
    "base_price": "5100000.00"
}
```

**Example Request:**

```bash
curl -X PATCH "http://localhost:8000/api/v1/rooms/dd0e8400-e29b-41d4-a716-446655440008" \
  -H "Authorization: Bearer {token}" \
  -H "X-Org-Id: 550e8400-e29b-41d4-a716-446655440000" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "maintenance",
    "base_price": "5100000.00"
  }'
```

**Response (200 OK):**

```json
{
    "data": {
        "id": "dd0e8400-e29b-41d4-a716-446655440008",
        "code": "A101",
        "name": "Room A101",
        "type": "apartment",
        "area": 35.5,
        "floor": 1,
        "capacity": 2,
        "base_price": "5100000.00",
        "status": "maintenance",
        "description": "Spacious apartment with balcony",
        "amenities": ["WiFi", "AC", "TV"],
        "utilities": ["Electricity", "Water"],
        "created_at": "2026-02-11T10:00:00Z",
        "updated_at": "2026-02-11T11:30:00Z"
    }
}
```

### Delete Room

**DELETE** `/api/v1/rooms/{id}`

**Headers:**

```
Authorization: Bearer {token}
X-Org-Id: {org_id}
```

**Example Request:**

```bash
curl -X DELETE "http://localhost:8000/api/v1/rooms/dd0e8400-e29b-41d4-a716-446655440008" \
  -H "Authorization: Bearer {token}" \
  -H "X-Org-Id: 550e8400-e29b-41d4-a716-446655440000"
```

**Response (204 No Content)**

---

## Error Responses

### 404 Not Found

```json
{
    "message": "Not Found"
}
```

### 422 Unprocessable Entity (Validation Error)

```json
{
    "message": "The given data was invalid.",
    "errors": {
        "email": ["The email field is required."],
        "password": ["The password confirmation does not match."]
    }
}
```

### 500 Internal Server Error

```json
{
    "message": "Internal Server Error"
}
```

---

## Getting Started

### 1. Register or Login to Get Token

#### Register as Tenant:

```bash
curl -X POST "http://localhost:8000/api/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "full_name": "John Doe",
    "email": "john.doe@company.com",
    "phone": "+1-555-0123",
    "password": "12345678",
    "password_confirmation": "12345678"
  }'
```

Response will include:

```json
{
    "user": {
        "id": "550e8400-e29b-41d4-a716-446655440000",
        "full_name": "John Doe",
        "email": "john.doe@company.com",
        "phone": "+1-555-0123",
        "roles": ["Tenant"]
    },
    "token": "1|abcDefGhIjKlMnOpQrStUvWxYz..."
}
```

#### Or Login with Existing Credentials:

```bash
curl -X POST "http://localhost:8000/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john.doe@company.com",
    "password": "12345678"
  }'
```

### 2. Get Organization ID (From Database Seeder)

```bash
php artisan tinker
>>> $org = \App\Models\Org::first();
>>> $org->id;
# Copy the ID and use it as X-Org-Id header
```

### 3. Test an Endpoint

```bash
# Replace {token} with the actual token and {org_id} with organization ID
curl -X GET "http://localhost:8000/api/v1/users" \
  -H "Authorization: Bearer {token}" \
  -H "X-Org-Id: {org_id}"
```

### 4. Create Resources (Example: Create Property)

```bash
curl -X POST "http://localhost:8000/api/v1/properties" \
  -H "Authorization: Bearer {token}" \
  -H "X-Org-Id: {org_id}" \
  -H "Content-Type: application/json" \
  -d '{
    "code": "PROP-TEST",
    "name": "Test Property",
    "address": "123 Test St",
    "use_floors": true,
    "default_billing_cycle": "MONTHLY",
    "default_due_day": 1,
    "default_cutoff_day": 25
  }'
```

### 5. Seed Sample Data

```bash
php artisan migrate:fresh --seed
# or specific seeder
php artisan db:seed --class=OrgSeeder
php artisan db:seed --class=RBACSeeder
```

This will create:

- **3 Organizations** with unique names and contact information
- **Multiple Users** with roles: Admin, Owner, Manager, Staff, Tenant (all with password: 12345678)
- **Properties, Floors, and Rooms** with realistic data

---

## Authentication Notes

- All responses include a `token` field in the format: `token_id|api_token`
- Tokens are valid for 7 days by default
- Use the token in the `Authorization: Bearer` header for all protected endpoints
- The `X-Org-Id` header is required for all v1 endpoints to enforce multi-tenant isolation
- Two-factor authentication is optional and can be enabled per user
- Rate limiting: 5 requests per minute for login and 2FA endpoints

---

## RBAC (Role-Based Access Control)

The API implements role-based access control with the following roles:

| Role    | Property | Floor | Room | Org  | User |
| ------- | -------- | ----- | ---- | ---- | ---- |
| Admin   | CRUD     | CRUD  | CRUD | CRUD | CRUD |
| Owner   | CRUD     | CRUD  | CRUD | CRUD | -    |
| Manager | CRUD     | CRUD  | CRUD | -    | -    |
| Staff   | RU       | RU    | RU   | -    | -    |
| Tenant  | R        | R     | R    | -    | -    |

Legend: C=Create, R=Read, U=Update, D=Delete

---

## Notes

- All timestamps are in ISO 8601 format (UTC)
- IDs are UUIDs (v4)
- Passwords are hashed and never returned in responses
- The API uses Spatie Query Builder for advanced filtering and sorting
- Multi-tenant isolation is enforced via the `X-Org-Id` header
- Permission-based access control is enforced automatically
- Users automatically get the "Tenant" role upon registration
- Admin users can assign other roles to users

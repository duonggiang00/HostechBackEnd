# API Documentation - Property Management System

## Base URL

```
http://localhost:8000/api/v1
```

## Authentication

All API requests require the tenant ID to be passed as a header (except for organization endpoints):

```
X-Org-Id: {org_id}
```

---

## Organizations Endpoint (`/orgs`)

### List Organizations

**GET** `/orgs`

Query Parameters:

- `per_page` (integer, optional): Items per page (default: 15, max: 100)
- `page` (integer, optional): Page number (default: 1)

**Example Request:**

```bash
curl -X GET "http://localhost:8000/api/v1/orgs?per_page=10"
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

**GET** `/orgs/{id}`

**Example Request:**

```bash
curl -X GET "http://localhost:8000/api/v1/orgs/550e8400-e29b-41d4-a716-446655440000"
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

**POST** `/orgs`

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

**PUT/PATCH** `/orgs/{id}`

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

**DELETE** `/orgs/{id}`

**Example Request:**

```bash
curl -X DELETE "http://localhost:8000/api/v1/orgs/550e8400-e29b-41d4-a716-446655440000"
```

**Response (204 No Content)**

---

## Users Endpoint (`/users`)

### List Users

**GET** `/users`

Query Parameters:

- `per_page` (integer, optional): Items per page (default: 15, max: 100)
- `page` (integer, optional): Page number (default: 1)
- `filter[role]` (string, optional): Filter by role (ADMIN, OWNER, STAFF)
- `filter[email]` (string, optional): Filter by email address
- `filter[is_active]` (boolean, optional): Filter by active status

**Example Request:**

```bash
curl -X GET "http://localhost:8000/api/v1/users?per_page=10&filter[role]=STAFF" \
  -H "X-Org-Id: 550e8400-e29b-41d4-a716-446655440000"
```

**Response (200 OK):**

```json
{
    "data": [
        {
            "id": "770e8400-e29b-41d4-a716-446655440002",
            "org_id": "550e8400-e29b-41d4-a716-446655440000",
            "role": "STAFF",
            "full_name": "John Doe",
            "phone": "+1-555-0789",
            "email": "john.doe@company.com",
            "email_verified_at": "2026-02-10T10:00:00Z",
            "is_active": true,
            "mfa_enabled": false,
            "last_login_at": "2026-02-11T09:00:00Z",
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

**GET** `/users/{id}`

**Example Request:**

```bash
curl -X GET "http://localhost:8000/api/v1/users/770e8400-e29b-41d4-a716-446655440002" \
  -H "X-Org-Id: 550e8400-e29b-41d4-a716-446655440000"
```

**Response (200 OK):**

```json
{
    "data": {
        "id": "770e8400-e29b-41d4-a716-446655440002",
        "org_id": "550e8400-e29b-41d4-a716-446655440000",
        "role": "STAFF",
        "full_name": "John Doe",
        "phone": "+1-555-0789",
        "email": "john.doe@company.com",
        "email_verified_at": "2026-02-10T10:00:00Z",
        "is_active": true,
        "mfa_enabled": false,
        "last_login_at": "2026-02-11T09:00:00Z",
        "created_at": "2026-02-01T10:00:00Z",
        "updated_at": "2026-02-11T10:00:00Z"
    }
}
```

### Create User

**POST** `/users`

Request Body:

```json
{
    "full_name": "Jane Smith",
    "phone": "+1-555-0321",
    "email": "jane.smith@company.com",
    "password": "secure_password_123",
    "password_confirmation": "secure_password_123",
    "role": "STAFF",
    "is_active": true
}
```

**Example Request:**

```bash
curl -X POST "http://localhost:8000/api/v1/users" \
  -H "Content-Type: application/json" \
  -H "X-Org-Id: 550e8400-e29b-41d4-a716-446655440000" \
  -d '{
    "full_name": "Jane Smith",
    "phone": "+1-555-0321",
    "email": "jane.smith@company.com",
    "password": "secure_password_123",
    "password_confirmation": "secure_password_123",
    "role": "STAFF",
    "is_active": true
  }'
```

**Response (201 Created):**

```json
{
    "data": {
        "id": "880e8400-e29b-41d4-a716-446655440003",
        "org_id": "550e8400-e29b-41d4-a716-446655440000",
        "role": "STAFF",
        "full_name": "Jane Smith",
        "phone": "+1-555-0321",
        "email": "jane.smith@company.com",
        "email_verified_at": null,
        "is_active": true,
        "mfa_enabled": false,
        "last_login_at": null,
        "created_at": "2026-02-11T11:00:00Z",
        "updated_at": "2026-02-11T11:00:00Z"
    }
}
```

### Update User

**PUT/PATCH** `/users/{id}`

Request Body (all fields optional, password requires confirmation):

```json
{
    "full_name": "Jane Doe Smith",
    "role": "OWNER"
}
```

**Example Request:**

```bash
curl -X PATCH "http://localhost:8000/api/v1/users/880e8400-e29b-41d4-a716-446655440003" \
  -H "Content-Type: application/json" \
  -H "X-Org-Id: 550e8400-e29b-41d4-a716-446655440000" \
  -d '{
    "full_name": "Jane Doe Smith",
    "role": "OWNER"
  }'
```

**Response (200 OK):**

```json
{
    "data": {
        "id": "880e8400-e29b-41d4-a716-446655440003",
        "org_id": "550e8400-e29b-41d4-a716-446655440000",
        "role": "OWNER",
        "full_name": "Jane Doe Smith",
        "phone": "+1-555-0321",
        "email": "jane.smith@company.com",
        "email_verified_at": null,
        "is_active": true,
        "mfa_enabled": false,
        "last_login_at": null,
        "created_at": "2026-02-11T11:00:00Z",
        "updated_at": "2026-02-11T11:30:00Z"
    }
}
```

### Delete User

**DELETE** `/users/{id}`

**Example Request:**

```bash
curl -X DELETE "http://localhost:8000/api/v1/users/880e8400-e29b-41d4-a716-446655440003" \
  -H "X-Org-Id: 550e8400-e29b-41d4-a716-446655440000"
```

**Response (204 No Content)**

---

## Properties Endpoint (`/properties`)

### List Properties

**GET** `/properties`

Query Parameters:

- `per_page` (integer, optional): Items per page (default: 15, max: 100)
- `page` (integer, optional): Page number (default: 1)
- `filter[name]` (string, optional): Filter by property name
- `filter[code]` (string, optional): Filter by property code
- `sort` (string, optional): Sort by field (e.g., `name`, `-name` for descending)

**Example Request:**

```bash
curl -X GET "http://localhost:8000/api/v1/properties?per_page=10&filter[name]=Main" \
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

**GET** `/properties/{id}`

**Example Request:**

```bash
curl -X GET "http://localhost:8000/api/v1/properties/990e8400-e29b-41d4-a716-446655440004" \
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

**POST** `/properties`

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
  -H "Content-Type: application/json" \
  -H "X-Org-Id: 550e8400-e29b-41d4-a716-446655440000" \
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

**PUT/PATCH** `/properties/{id}`

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
  -H "Content-Type: application/json" \
  -H "X-Org-Id: 550e8400-e29b-41d4-a716-446655440000" \
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

**DELETE** `/properties/{id}`

**Example Request:**

```bash
curl -X DELETE "http://localhost:8000/api/v1/properties/990e8400-e29b-41d4-a716-446655440004" \
  -H "X-Org-Id: 550e8400-e29b-41d4-a716-446655440000"
```

**Response (204 No Content)**

---

## Floors Endpoint (`/floors`)

### List Floors

**GET** `/floors`

Query Parameters:

- `per_page` (integer, optional): Items per page (default: 15, max: 100)
- `page` (integer, optional): Page number (default: 1)
- `filter[property_id]` (UUID, optional): Filter by property ID
- `sort` (string, optional): Sort by field (e.g., `sort_order`, `-sort_order`)

**Example Request:**

```bash
curl -X GET "http://localhost:8000/api/v1/floors?per_page=20&filter[property_id]=990e8400-e29b-41d4-a716-446655440004" \
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

**GET** `/floors/{id}`

**Example Request:**

```bash
curl -X GET "http://localhost:8000/api/v1/floors/bb0e8400-e29b-41d4-a716-446655440006" \
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

**POST** `/floors`

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
  -H "Content-Type: application/json" \
  -H "X-Org-Id: 550e8400-e29b-41d4-a716-446655440000" \
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

**PUT/PATCH** `/floors/{id}`

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
  -H "Content-Type: application/json" \
  -H "X-Org-Id: 550e8400-e29b-41d4-a716-446655440000" \
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

**DELETE** `/floors/{id}`

**Example Request:**

```bash
curl -X DELETE "http://localhost:8000/api/v1/floors/bb0e8400-e29b-41d4-a716-446655440006" \
  -H "X-Org-Id: 550e8400-e29b-41d4-a716-446655440000"
```

**Response (204 No Content)**

---

## Rooms Endpoint (`/rooms`)

### List Rooms

**GET** `/rooms`

Query Parameters:

- `per_page` (integer, optional): Items per page (default: 15, max: 100)
- `page` (integer, optional): Page number (default: 1)
- `filter[code]` (string, optional): Filter by room code
- `filter[status]` (string, optional): Filter by status (available, occupied, maintenance, reserved)
- `filter[type]` (string, optional): Filter by type (studio, apartment, house, dormitory, other)
- `filter[property_id]` (UUID, optional): Filter by property ID
- `sort` (string, optional): Sort by field (e.g., `code`, `-code`, `base_price`)

**Example Request:**

```bash
curl -X GET "http://localhost:8000/api/v1/rooms?per_page=20&filter[status]=available&filter[property_id]=990e8400-e29b-41d4-a716-446655440004" \
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

**GET** `/rooms/{id}`

**Example Request:**

```bash
curl -X GET "http://localhost:8000/api/v1/rooms/dd0e8400-e29b-41d4-a716-446655440008" \
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

**POST** `/rooms`

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
  -H "Content-Type: application/json" \
  -H "X-Org-Id: 550e8400-e29b-41d4-a716-446655440000" \
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

**PUT/PATCH** `/rooms/{id}`

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
  -H "Content-Type: application/json" \
  -H "X-Org-Id: 550e8400-e29b-41d4-a716-446655440000" \
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

**DELETE** `/rooms/{id}`

**Example Request:**

```bash
curl -X DELETE "http://localhost:8000/api/v1/rooms/dd0e8400-e29b-41d4-a716-446655440008" \
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

## Running Seeders

To populate the database with sample data:

```bash
php artisan migrate:fresh --seed
# or specific seeder
php artisan db:seed --class=OrgSeeder
```

This will create:

- **3 Organizations** with unique names and contact information
- **9 Users** (3 per organization) with roles: ADMIN, OWNER, STAFF
- **6 Properties** (2 per organization) with billing configuration
- **24 Floors** (4 per property) with sort order
- **120+ Rooms** (5 per floor) with varied types, prices, and amenities

---

## Getting Started

### 1. Get First Organization ID

```bash
php artisan tinker
>>> $org = \App\Models\Org::first();
>>> $org->id;
# Copy the ID and use it as X-Org-Id header
```

### 2. Test an Endpoint

```bash
# Replace {org_id} with the actual organization ID
curl -X GET "http://localhost:8000/api/v1/users" \
  -H "X-Org-Id: {org_id}"
```

### 3. Create Data

```bash
curl -X POST "http://localhost:8000/api/v1/properties" \
  -H "Content-Type: application/json" \
  -H "X-Org-Id: {org_id}" \
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

---

## Notes

- All timestamps are in ISO 8601 format (UTC)
- IDs are UUIDs (v4)
- Passwords are hashed and never returned in responses
- The API uses Spatie Query Builder for advanced filtering and sorting
- Multi-tenant isolation is enforced via the `X-Org-Id` header (except for org endpoints)
- Empty relationships may be `null` or empty arrays depending on the resource
- Pagination defaults to 15 items per page, maximum 100 items per page

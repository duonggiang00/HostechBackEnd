# API Documentation - Property Management System

## Overview

This API uses **Policy-based Authorization** combined with **Role-Based Access Control (RBAC)** using Spatie Laravel Permission.

---

## Table of Contents

1. [Authentication](#authentication)
2. [Authorization & Policies](#authorization--policies)
3. [Soft Delete](#soft-delete)
4. [Authentication Endpoints](#authentication-endpoints)
5. [Protected API Endpoints (v1)](#protected-api-endpoints-v1)
6. [Error Handling](#error-handling)
7. [Examples](#examples)

---

## Base URL

```
http://localhost:8000
```

---

## Authentication

### Required Headers

All v1 API requests require:

- **Authorization**: Bearer token from Sanctum authentication
- **X-Org-Id**: Organization ID (required for organization-scoped operations)

```bash
-H "Authorization: Bearer {token}"
-H "X-Org-Id: {org_id}"
```

### Token Acquisition

Tokens are obtained from the login or register endpoints and valid for sessions until logout or token revocation.

---

## Authorization & Policies

### Role Hierarchy

The system implements 6 roles with different permission scopes:

| Role           | Scope             | Access Level                                     |
| -------------- | ----------------- | ------------------------------------------------ |
| **SuperAdmin** | System-wide       | All resources, all actions, bypass org isolation |
| **Admin**      | Organization-wide | All resources within organization, all actions   |
| **Owner**      | Organization-wide | Full CRUD for Users, Properties, Floors, Rooms   |
| **Manager**    | Property-level    | CRUD for Floors & Rooms, Update Properties       |
| **Staff**      | Property-level    | Read Properties/Floors/Rooms, Update Rooms       |
| **Tenant**     | Room-level        | Read-only access to Rooms                        |

### Policy-Based Authorization Matrix

Each endpoint checks authorization through Laravel Policies:

#### Users Module

```
viewAny   : SuperAdmin, Admin, Owner, Manager
view      : SuperAdmin, Admin, Owner (same org), Manager (same org)
create    : SuperAdmin, Admin, Owner
update    : SuperAdmin, Admin, Owner (same org)
delete    : SuperAdmin, Admin, Owner (same org)
```

#### Organizations Module

```
viewAny   : SuperAdmin, Admin, Owner
view      : SuperAdmin, Admin, Owner (own org)
create    : SuperAdmin, Admin only
update    : SuperAdmin, Admin, Owner (own org)
delete    : SuperAdmin, Admin, Owner (own org)
```

#### Properties Module

```
viewAny   : SuperAdmin, Admin, Owner, Manager, Staff
view      : SuperAdmin, Admin, Owner, Manager, Staff (same org)
create    : SuperAdmin, Admin, Owner
update    : SuperAdmin, Admin, Owner, Manager (same org)
delete    : SuperAdmin, Admin, Owner (same org)
```

#### Floors Module

```
viewAny   : SuperAdmin, Admin, Owner, Manager, Staff
view      : SuperAdmin, Admin, Owner, Manager, Staff (same org)
create    : SuperAdmin, Admin, Owner, Manager
update    : SuperAdmin, Admin, Owner, Manager
delete    : SuperAdmin, Admin, Owner, Manager (same org)
```

#### Rooms Module

```
viewAny   : SuperAdmin, Admin, Owner, Manager, Staff, Tenant (same org)
view      : SuperAdmin, Admin, Owner, Manager, Staff, Tenant (same org)
create    : SuperAdmin, Admin, Owner, Manager
update    : SuperAdmin, Admin, Owner, Manager, Staff (same org)
delete    : SuperAdmin, Admin, Owner, Manager (same org)
```

### Authorization Errors

If a user lacks authorization:

**HTTP 403 Forbidden**

```json
{
    "message": "This action is unauthorized."
}
```

---

## Soft Delete

All resources support soft delete (data preservation) and permanent delete (hard delete). When a resource is soft deleted, it's hidden from normal queries but can be restored.

### Soft Delete Behavior

- **Soft Delete (DELETE)**: Records marked for deletion but kept in database with `deleted_at` timestamp
- **Restore**: Recovers a previously soft-deleted record
- **Force Delete (Permanent)**: Completely removes record from database

### Query Soft-Deleted Records

By default, all list endpoints exclude soft-deleted records. To include them:

**Query Parameter**: `?with_trashed=true`

```bash
curl -X GET "http://localhost:8000/api/v1/users?with_trashed=true" \
  -H "Authorization: Bearer {token}" \
  -H "X-Org-Id: {org_id}"
```

**Response includes both active and soft-deleted records**:

```json
{
    "data": [
        {
            "id": "550e8400-e29b-41d4-a716-446655440000",
            "full_name": "John Doe",
            "email": "john.doe@example.com",
            "deleted_at": null
        },
        {
            "id": "660e8400-e29b-41d4-a716-446655440001",
            "full_name": "Deleted User",
            "email": "deleted@example.com",
            "deleted_at": "2026-02-12T10:30:00Z"
        }
    ]
}
```

### Restore a Soft-Deleted Resource

**POST** `/api/v1/{resource}/{id}/restore`

Restore a previously soft-deleted resource. Requires delete authorization.

**Parameters**:

- `{resource}`: One of `users`, `orgs`, `properties`, `floors`, `rooms`
- `{id}`: Resource ID

**Response (200 OK)**:

```json
{
    "id": "660e8400-e29b-41d4-a716-446655440001",
    "full_name": "Restored User",
    "email": "restored@example.com",
    "deleted_at": null
}
```

**Example**:

```bash
curl -X POST "http://localhost:8000/api/v1/users/660e8400-e29b-41d4-a716-446655440001/restore" \
  -H "Authorization: Bearer {token}" \
  -H "X-Org-Id: {org_id}"
```

### Permanently Delete a Resource

**DELETE** `/api/v1/{resource}/{id}/force`

Permanently remove a resource from the database (hard delete). Cannot be undone. Requires delete authorization.

**Parameters**:

- `{resource}`: One of `users`, `orgs`, `properties`, `floors`, `rooms`
- `{id}`: Resource ID

**Response (200 OK)**:

```json
{
    "message": "Permanently deleted successfully"
}
```

**Example**:

```bash
curl -X DELETE "http://localhost:8000/api/v1/users/660e8400-e29b-41d4-a716-446655440001/force" \
  -H "Authorization: Bearer {token}" \
  -H "X-Org-Id: {org_id}"
```

---

---

## Authentication Endpoints

These endpoints do NOT require authorization headers.

### Register User

**POST** `/api/auth/register`

Create a new user account. New users automatically receive the **Tenant** role.

**Request Body:**

```json
{
    "full_name": "John Doe",
    "email": "john.doe@company.com",
    "phone": "+84-912-345-678",
    "password": "Password123!",
    "password_confirmation": "Password123!"
}
```

**Response (201 Created):**

```json
{
    "user": {
        "id": "550e8400-e29b-41d4-a716-446655440000",
        "full_name": "John Doe",
        "email": "john.doe@company.com",
        "phone": "+84-912-345-678",
        "roles": ["Tenant"]
    },
    "token": "1|abcDefGhIjKlMnOpQrStUvWxYz..."
}
```

**Example Request:**

```bash
curl -X POST "http://localhost:8000/api/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "full_name": "John Doe",
    "email": "john.doe@example.com",
    "phone": "+84-912-345-678",
    "password": "Password123!",
    "password_confirmation": "Password123!"
  }'
```

---

### Login

**POST** `/api/auth/login`

Authenticate with email and password. Returns Sanctum bearer token.

**Request Body:**

```json
{
    "email": "john.doe@example.com",
    "password": "Password123!"
}
```

**Response (200 OK):**

```json
{
    "user": {
        "id": "550e8400-e29b-41d4-a716-446655440000",
        "full_name": "John Doe",
        "email": "john.doe@example.com",
        "org_id": "650e8400-e29b-41d4-a716-446655440001",
        "roles": ["Tenant", "Staff"],
        "permissions": ["read Room", "update Room"]
    },
    "token": "1|abcDefGhIjKlMnOpQrStUvWxYz..."
}
```

**Example Request:**

```bash
curl -X POST "http://localhost:8000/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john.doe@example.com",
    "password": "Password123!"
  }'
```

---

### Logout

**POST** `/api/auth/logout`

Revoke the current bearer token.

**Required Headers:**

```
Authorization: Bearer {token}
```

**Response (200 OK):**

```json
{
    "message": "Logged out successfully"
}
```

**Example Request:**

```bash
curl -X POST "http://localhost:8000/api/auth/logout" \
  -H "Authorization: Bearer 1|abcDefGhIjKlMnOpQrStUvWxYz..."
```

---

### Password Reset Request

**POST** `/api/auth/forgot-password`

Request a password reset link via email.

**Request Body:**

```json
{
    "email": "john.doe@example.com"
}
```

**Response (200 OK):**

```json
{
    "message": "We have emailed your password reset link."
}
```

---

### Password Reset

**POST** `/api/auth/reset-password`

Reset password using the token from email.

**Request Body:**

```json
{
    "email": "john.doe@example.com",
    "token": "reset_token_from_email",
    "password": "NewPassword123!",
    "password_confirmation": "NewPassword123!"
}
```

**Response (200 OK):**

```json
{
    "message": "Password reset successfully"
}
```

---

## Protected API Endpoints (v1)

All v1 endpoints require authentication and authorization via policies.

### Required Headers

```bash
-H "Authorization: Bearer {token}"
-H "X-Org-Id: {org_id}"
-H "Content-Type: application/json"
```

---

## Organizations

### Get All Organizations

**GET** `/api/v1/orgs`

**Authorization**: SuperAdmin, Admin, Owner

**Query Parameters:**

```
?page=1&per_page=15&with_trashed=true
```

The `with_trashed` parameter includes soft-deleted organizations in the response (default: false).

**Response (200 OK):**

```json
{
    "data": [
        {
            "id": "550e8400-e29b-41d4-a716-446655440000",
            "name": "ABC Property Management",
            "phone": "+84-123-456-789",
            "email": "contact@abc.com",
            "address": "123 Main St, City, Country"
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
        "per_page": 15,
        "to": 1,
        "total": 1
    }
}
```

**Example Request:**

```bash
curl -X GET "http://localhost:8000/api/v1/orgs?page=1&per_page=15" \
  -H "Authorization: Bearer 1|abcDefGhIjKlMnOpQrStUvWxYz..."
```

---

### Create Organization

**POST** `/api/v1/orgs`

**Authorization**: SuperAdmin, Admin only

**Request Body:**

```json
{
    "name": "New Property Group",
    "phone": "+84-987-654-321",
    "email": "info@newgroup.com",
    "address": "456 Oak Ave, City, Country"
}
```

**Response (201 Created):**

```json
{
    "id": "750e8400-e29b-41d4-a716-446655440002",
    "name": "New Property Group",
    "phone": "+84-987-654-321",
    "email": "info@newgroup.com",
    "address": "456 Oak Ave, City, Country"
}
```

---

### Get Organization Details

**GET** `/api/v1/orgs/{id}`

**Authorization**: SuperAdmin, Admin, Owner (own org)

**Response (200 OK):**

```json
{
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "ABC Property Management",
    "phone": "+84-123-456-789",
    "email": "contact@abc.com",
    "address": "123 Main St, City, Country"
}
```

---

### Update Organization

**PUT** `/api/v1/orgs/{id}`

**Authorization**: SuperAdmin, Admin, Owner (own org)

**Request Body:**

```json
{
    "name": "Updated Organization Name",
    "phone": "+84-111-222-333",
    "email": "updated@org.com",
    "address": "789 New St, City, Country"
}
```

**Response (200 OK):**

```json
{
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "Updated Organization Name",
    "phone": "+84-111-222-333",
    "email": "updated@org.com",
    "address": "789 New St, City, Country"
}
```

---

### Delete Organization

**DELETE** `/api/v1/orgs/{id}`

**Authorization**: SuperAdmin, Admin only

**Response (200 OK):**

```json
{
    "message": "Deleted successfully"
}
```

---

### Restore Organization

**POST** `/api/v1/orgs/{id}/restore`

**Authorization**: SuperAdmin, Admin only

**Response (200 OK):**

```json
{
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "ABC Property Management",&with_trashed=true
```

The `with_trashed` parameter includes soft-deleted users in the response (default: false). "phone": "+84-123-456-789",
"email": "contact@abc.com",
"address": "123 Main St, City, Country"
}

````

---

### Permanently Delete Organization

**DELETE** `/api/v1/orgs/{id}/force`

**Authorization**: SuperAdmin, Admin only

**Response (200 OK):**

```json
{
    "message": "Permanently deleted successfully"
}
````

---

## Users

### Get All Users

**GET** `/api/v1/users`

**Authorization**: SuperAdmin, Admin, Owner, Manager

**Query Parameters:**

```
?page=1&per_page=15&filter[email]=john&filter[is_active]=1
```

**Response (200 OK):**

```json
{
    "data": [
        {
            "id": "550e8400-e29b-41d4-a716-446655440000",
            "full_name": "John Doe",
            "email": "john.doe@example.com",
            "phone": "+84-912-345-678",
            "roles": ["Tenant"],
            "is_active": true
        }
    ],
    "links": {},
    "meta": {
        "current_page": 1,
        "per_page": 15,
        "total": 100
    }
}
```

**Example Request:**

```bash
curl -X GET "http://localhost:8000/api/v1/users?page=1&per_page=15" \
  -H "Authorization: Bearer 1|abcDefGhIjKlMnOpQrStUvWxYz..." \
  -H "X-Org-Id: 550e8400-e29b-41d4-a716-446655440000"
```

---

### Create User

**POST** `/api/v1/users`

**Authorization**: SuperAdmin, Admin, Owner only

**Request Body:**

```json
{
    "full_name": "Jane Smith",
    "email": "jane.smith@example.com",
    "phone": "+84-912-345-679",
    "password": "SecurePass123!",
    "password_confirmation": "SecurePass123!",
    "is_active": true
}
```

**Response (201 Created):**

```json
{
    "id": "660e8400-e29b-41d4-a716-446655440001",
    "full_name": "Jane Smith",
    "email": "jane.smith@example.com",
    "phone": "+84-912-345-679",
    "org_id": "550e8400-e29b-41d4-a716-446655440000",
    "roles": ["Tenant"],
    "is_active": true
}
```

---

### Get User Details

**GET** `/api/v1/users/{id}`

**Authorization**: SuperAdmin, Admin, Owner (same org), Manager (same org)

**Response (200 OK):**

```json
{
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "full_name": "John Doe",
    "email": "john.doe@example.com",
    "phone": "+84-912-345-678",
    "org_id": "750e8400-e29b-41d4-a716-446655440000",
    "roles": ["Owner"],
    "is_active": true,
    "email_verified_at": "2024-02-12T10:30:00Z"
}
```

---

### Update User

**PUT** `/api/v1/users/{id}`

**Authorization**: SuperAdmin, Admin, Owner (same org)

**Request Body:**

```json
{
    "full_name": "John Updated",
    "phone": "+84-912-345-680",
    "is_active": true
}
```

**Response (200 OK):**

```json
{
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "full_name": "John Updated",
    "email": "john.doe@example.com",
    "phone": "+84-912-345-680",
    "roles": ["Owner"],
    "is_active": true
}
```

---

### Delete User

**DELETE** `/api/v1/users/{id}`

**Authorization**: SuperAdmin, Admin, Owner (same org)

**Response (200 OK):**

````json
{


---

### Restore User

**POST** `/api/v1/users/{id}/restore`

**Authorization**: SuperAdmin, Admin, Owner (same org)

**Response (200 OK):**

```json
{
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "full_name": "John Doe",
    "email": "john.doe@example.com",
    "phone": "+84-912-345-678",&with_trashed=true
````

The `with_trashed` parameter includes soft-deleted properties in the response (default: false). "roles": ["Owner"],
"is_active": true
}

````

---

### Permanently Delete User

**DELETE** `/api/v1/users/{id}/force`

**Authorization**: SuperAdmin, Admin, Owner (same org)

**Response (200 OK):**

```json
{
    "message": "Permanently deleted successfully"
}
``` "message": "Deleted successfully"
}
````

---

## Properties

### Get All Properties

**GET** `/api/v1/properties`

**Authorization**: SuperAdmin, Admin, Owner, Manager, Staff

**Query Parameters:**

```
?page=1&per_page=15&filter[code]=PROP&filter[name]=residential
```

**Response (200 OK):**

```json
{
    "data": [
        {
            "id": "550e8400-e29b-41d4-a716-446655440000",
            "org_id": "750e8400-e29b-41d4-a716-446655440000",
            "code": "PROP-001",
            "name": "Downtown Residential Complex",
            "address": "123 Main St, Downtown",
            "phone": "+84-123-456-700",
            "email": "property@example.com",
            "description": "Modern residential building with 50 units"
        }
    ],
    "links": {},
    "meta": {
        "current_page": 1,
        "per_page": 15,
        "total": 25
    }
}
```

**Example Request:**

```bash
curl -X GET "http://localhost:8000/api/v1/properties?page=1" \
  -H "Authorization: Bearer 1|abcDefGhIjKlMnOpQrStUvWxYz..." \
  -H "X-Org-Id: 550e8400-e29b-41d4-a716-446655440000"
```

---

### Create Property

**POST** `/api/v1/properties`

**Authorization**: SuperAdmin, Admin, Owner only

**Request Body:**

```json
{
    "code": "PROP-002",
    "name": "New Business Park",
    "address": "456 Commerce Ave",
    "phone": "+84-123-456-701",
    "email": "park@example.com",
    "description": "Commercial business complex"
}
```

**Response (201 Created):**

```json
{
    "id": "660e8400-e29b-41d4-a716-446655440002",
    "org_id": "750e8400-e29b-41d4-a716-446655440000",
    "code": "PROP-002",
    "name": "New Business Park",
    "address": "456 Commerce Ave",
    "phone": "+84-123-456-701",
    "email": "park@example.com",
    "description": "Commercial business complex"
}
```

---

### Get Property Details

**GET** `/api/v1/properties/{id}`

**Authorization**: SuperAdmin, Admin, Owner, Manager, Staff (same org)

**Response (200 OK):**

```json
{
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "org_id": "750e8400-e29b-41d4-a716-446655440000",
    "code": "PROP-001",
    "name": "Downtown Residential Complex",
    "address": "123 Main St, Downtown",
    "phone": "+84-123-456-700",
    "email": "property@example.com",
    "description": "Modern residential building with 50 units"
}
```

---

### Update Property

**PUT** `/api/v1/properties/{id}`

**Authorization**: SuperAdmin, Admin, Owner, Manager (same org)

**Request Body:**

```json
{
    "name": "Updated Property Name",
    "address": "789 New Location",
    "phone": "+84-123-456-799",
    "description": "Updated description"
}
```

**Response (200 OK):**

```json
{
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "org_id": "750e8400-e29b-41d4-a716-446655440000",
    "code": "PROP-001",
    "name": "Updated Property Name",
    "address": "789 New Location",
    "phone": "+84-123-456-799",
    "description": "Updated description"
}
```

---

### Delete Property

**DELETE** `/api/v1/properties/{id}`

**Authorization**: SuperAdmin, Admin, Owner (same org)

**Response (200 OK):**

````json
{


---

### Restore Property

**POST** `/api/v1/properties/{id}/restore`

**Authorization**: SuperAdmin, Admin, Owner (same org)

**Response (200 OK):**

```json
{
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "org_id": "750e8400-e29b-41d4-a716-446655440000",&with_trashed=true
````

The `with_trashed` parameter includes soft-deleted floors in the response (default: false). "code": "PROP-001",
"name": "Downtown Residential Complex",
"address": "123 Main St, Downtown",
"phone": "+84-123-456-700",
"email": "property@example.com",
"description": "Modern residential building with 50 units"
}

````

---

### Permanently Delete Property

**DELETE** `/api/v1/properties/{id}/force`

**Authorization**: SuperAdmin, Admin, Owner (same org)

**Response (200 OK):**

```json
{
    "message": "Permanently deleted successfully"
}
``` "message": "Deleted successfully"
}
````

---

## Floors

### Get All Floors

**GET** `/api/v1/floors`

**Authorization**: SuperAdmin, Admin, Owner, Manager, Staff

**Query Parameters:**

```
?page=1&per_page=15&filter[property_id]=550e8400-e29b-41d4-a716-446655440000
```

**Response (200 OK):**

```json
{
    "data": [
        {
            "id": "550e8400-e29b-41d4-a716-446655440000",
            "org_id": "750e8400-e29b-41d4-a716-446655440000",
            "property_id": "550e8400-e29b-41d4-a716-446655440001",
            "code": "F-01",
            "name": "Ground Floor",
            "description": "Retail and common areas",
            "sort_order": 1
        }
    ],
    "links": {},
    "meta": {
        "current_page": 1,
        "per_page": 15,
        "total": 8
    }
}
```

---

### Create Floor

**POST** `/api/v1/floors`

**Authorization**: SuperAdmin, Admin, Owner, Manager only

**Request Body:**

````json
{
    "property_id": "550e8400-e29b-41d4-a716-446655440001",
    "code": "F-02",
    "name": "First Floor",
    "description": "Residential apartments",

**Response (200 OK):**

```json
{
    "message": "Deleted successfully"
}
````

---

### Restore Floor

**POST** `/api/v1/floors/{id}/restore`

**Authorization**: SuperAdmin, Admin, Owner, Manager (same org)

**Response (200 OK):**

```json
{
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "org_id": "750e8400-e29b-41d4-a716-446655440000",
    "property_id": "550e8400-e29b-41d4-a716-446655440001",
    "code": "F-01",
    "name": "Ground Floor",
    "description": "Retail and common areas",
    "sort_order": 1
}
```

---

### Permanently Delete Floor

**DELETE** `/api/v1/floors/{id}/force`

**Authorization**: SuperAdmin, Admin, Owner, Manager (same org)

**Response (200 OK):**

```json
{
    "message": "Permanently deleted successfully"
}
```

    "sort_order": 2

}

````

**Response (201 Created):**

```json
{&with_trashed=true
````

The `with_trashed` parameter includes soft-deleted rooms in the response (default: false). "id": "660e8400-e29b-41d4-a716-446655440002",
"org_id": "750e8400-e29b-41d4-a716-446655440000",
"property_id": "550e8400-e29b-41d4-a716-446655440001",
"code": "F-02",
"name": "First Floor",
"description": "Residential apartments",
"sort_order": 2
}

```

---

### Get Floor Details

**GET** `/api/v1/floors/{id}`

**Authorization**: SuperAdmin, Admin, Owner, Manager, Staff (same org)

---

### Update Floor

**PUT** `/api/v1/floors/{id}`

**Authorization**: SuperAdmin, Admin, Owner, Manager (same org)

---

### Delete Floor

**DELETE** `/api/v1/floors/{id}`

**Authorization**: SuperAdmin, Admin, Owner, Manager (same org)

---

## Rooms

### Get All Rooms

**GET** `/api/v1/rooms`

**Authorization**: SuperAdmin, Admin, Owner, Manager, Staff, Tenant (same org)

**Query Parameters:**

```

?page=1&per_page=15&filter[property_id]=550e8400-e29b-41d4-a716-446655440000&filter[status]=available

````

**Response (200 OK):**

```json
{
    "data": [
        {
            "id": "550e8400-e29b-41d4-a716-446655440000",
            "org_id": "750e8400-e29b-41d4-a716-446655440000",
            "property_id": "550e8400-e29b-41d4-a716-446655440001",
            "floor_id": "550e8400-e29b-41d4-a716-446655440002",
            "code": "R-101",
            "name": "Room 101",
            "type": "studio",
            "area": 35.5,
            "capacity": 2,
            "base_price": 1500000,
            "status": "available",
            "description": "Modern studio apartment"
        }
    ],
    "links": {},
    "meta": {
        "current_page": 1,
        "per_page": 15,
        "total": 150
    }
}
````

---

### Create Room

**POST** `/api/v1/rooms`

**Authorization**: SuperAdmin, Admin, Owner, Manager only

**Request Body:**

```json
{
    "property_id": "550e8400-e29b-41d4-a716-446655440001",
    "floor_id": "550e8400-e29b-41d4-a716-446655440002",
    "code": "R-102",
    "name": "Room 102",
    "type": "1-bedroom",
    "area": 50.0,
    "capacity": 3,
    "base_price": 2000000,
    "status": "available",
    "description": "Spacious 1-bedroom apartment"
}
```

**Response (201 Created):**

**Response (200 OK):**

```json
{
    "message": "Deleted successfully"
}
```

---

### Restore Room

**POST** `/api/v1/rooms/{id}/restore`

**Authorization**: SuperAdmin, Admin, Owner, Manager (same org)

**Response (200 OK):**

```json
{
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "org_id": "750e8400-e29b-41d4-a716-446655440000",
    "property_id": "550e8400-e29b-41d4-a716-446655440001",
    "floor_id": "550e8400-e29b-41d4-a716-446655440002",
    "code": "R-101",
    "name": "Room 101",
    "type": "studio",
    "area": 35.5,
    "capacity": 2,
    "base_price": 1500000,
    "status": "available",
    "description": "Modern studio apartment"
}
```

---

### Permanently Delete Room

**DELETE** `/api/v1/rooms/{id}/force`

**Authorization**: SuperAdmin, Admin, Owner, Manager (same org)

**Response (200 OK):**

```json
{
    "message": "Permanently deleted successfully"
}
```

```json
{
    "id": "660e8400-e29b-41d4-a716-446655440003",
    "org_id": "750e8400-e29b-41d4-a716-446655440000",
    "property_id": "550e8400-e29b-41d4-a716-446655440001",
    "floor_id": "550e8400-e29b-41d4-a716-446655440002",
    "code": "R-102",
    "name": "Room 102",
    "type": "1-bedroom",
    "area": 50.0,
    "capacity": 3,
    "base_price": 2000000,
    "status": "available",
    "description": "Spacious 1-bedroom apartment"
}
```

---

### Get Room Details

**GET** `/api/v1/rooms/{id}`

**Authorization**: SuperAdmin, Admin, Owner, Manager, Staff, Tenant (same org)

---

### Update Room

**PUT** `/api/v1/rooms/{id}`

**Authorization**: SuperAdmin, Admin, Owner, Manager, Staff (same org)

**Request Body:**

```json
{
    "name": "Updated Room 101",
    "status": "maintenance",
    "base_price": 1600000
}
```

---

### Delete Room

**DELETE** `/api/v1/rooms/{id}`

**Authorization**: SuperAdmin, Admin, Owner, Manager (same org)

---

## Error Handling

### Common HTTP Status Codes

| Code | Meaning                                                     |
| ---- | ----------------------------------------------------------- |
| 200  | OK - Request successful                                     |
| 201  | Created - Resource created successfully                     |
| 400  | Bad Request - Invalid request parameters                    |
| 401  | Unauthorized - Missing or invalid token                     |
| 403  | Forbidden - User lacks authorization to access resource     |
| 404  | Not Found - Resource not found                              |
| 422  | Unprocessable Entity - Validation error                     |
| 429  | Too Many Requests - Rate limited (login: 5/min, 2FA: 5/min) |
| 500  | Server Error                                                |

### Error Response Format

```json
{
    "message": "The given data was invalid.",
    "errors": {
        "email": ["The email has already been taken."],
        "password": ["Password must be at least 8 characters."]
    }
}
```

### Authentication Error

**HTTP 401 Unauthorized**

```json
{
    "message": "Unauthenticated"
}
```

### Authorization Error

**HTTP 403 Forbidden**

```json
{
    "message": "This action is unauthorized."
}
```

---

## Examples

### Full Workflow: Register, Get Token, Access Protected Route

#### 1. Register

```bash
curl -X POST "http://localhost:8000/api/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "full_name": "John Doe",
    "email": "john@example.com",
    "phone": "+84-912-345-678",
    "password": "Password123!",
    "password_confirmation": "Password123!"
  }'
```

**Response:**

```json
{
    "user": {
        "id": "550e8400-e29b-41d4-a716-446655440000",
        "full_name": "John Doe",
        "email": "john@example.com",
        "roles": ["Tenant"]
    },
    "token": "1|abcDefGhIjKlMnOpQrStUvWxYz..."
}
```

#### 2. Login (Alternative)

```bash
curl -X POST "http://localhost:8000/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "Password123!"
  }'
```

#### 3. Access Protected Endpoint

```bash
curl -X GET "http://localhost:8000/api/v1/rooms?page=1" \
  -H "Authorization: Bearer 1|abcDefGhIjKlMnOpQrStUvWxYz..." \
  -H "X-Org-Id: 550e8400-e29b-41d4-a716-446655440000"
```

#### 4. Logout

```bash
curl -X POST "http://localhost:8000/api/auth/logout" \
  -H "Authorization: Bearer 1|abcDefGhIjKlMnOpQrStUvWxYz..."
```

---

## Test Accounts

### SuperAdmin (System-wide access)

```
Email: admin@example.com
Password: 12345678
Roles: SuperAdmin
```

### Organization Accounts (Pre-seeded)

The application comes with 3 pre-seeded organizations. Each has:

- 1 Admin (email: admin.{slug}@org.example.com)
- 1 Owner (email: owner.{slug}@org.example.com)
- 1 Manager (email: manager.{slug}@org.example.com)
- 1 Staff (email: staff.{slug}@org.example.com)
- 1 Tenant (email: tenant.{slug}@org.example.com)

All test accounts use password: **12345678**

---

## Rate Limiting

- **Login**: 5 requests per minute per email
- **Two-Factor Auth**: 5 requests per minute per user

---

## Support

For issues or questions about the API, contact the development team.

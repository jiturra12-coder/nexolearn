# API_SPEC_V1

Date: 2026-06-04

Role: API Architect

This document specifies the complete REST API for NexoLearn MVP V1. It covers authentication, resource endpoints, request/response schemas, validation, permissions, and error handling.

## Overview

The NexoLearn API is a RESTful service built on Next.js API Routes or NestJS. All endpoints require Supabase JWT authentication (except signup/login). Responses follow JSON format. Errors include structured error codes and details.

Base URL: `https://api.nexolearn.com/v1` (or `http://localhost:3000/api/v1` for local development)

## Common Patterns

### Authentication
All endpoints (except `/auth/signup` and `/auth/login`) require the `Authorization: Bearer <supabase_jwt_token>` header.

Token is validated server-side to extract user_id and enforce RLS on all queries.

### Request Headers
```
Authorization: Bearer <jwt_token>
Content-Type: application/json
Accept: application/json
```

### Response Format
```json
{
  "data": { /* resource or array */ },
  "meta": {
    "pagination": { /* if applicable */ }
  }
}
```

Error responses:
```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable message",
    "details": { /* optional */ }
  }
}
```

### HTTP Status Codes
- 200 OK: successful read or update
- 201 Created: successful creation
- 204 No Content: successful deletion or empty response
- 400 Bad Request: validation error
- 401 Unauthorized: auth token missing or invalid
- 403 Forbidden: insufficient permissions
- 404 Not Found: resource not found
- 409 Conflict: business rule violation
- 422 Unprocessable Entity: semantic error
- 429 Too Many Requests: rate limit exceeded
- 500 Internal Server Error: unexpected server error

### Pagination
All list endpoints support:
- `page`: page number (1-indexed, default 1)
- `limit`: items per page (default 20, max 100)

Response includes:
```json
{
  "data": [ /* items */ ],
  "meta": {
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 150,
      "totalPages": 8
    }
  }
}
```

### Filtering
List endpoints support optional filters as query parameters.

Common filters:
- `status`: filter by status (e.g., `?status=active,completed`)
- `skill_id`: filter by skill UUID
- `search`: full-text search on name/title/description
- `created_after`: filter by creation date (ISO 8601)
- `created_before`: filter by creation date (ISO 8601)

### Sorting
List endpoints support optional sorting via `sort` query parameter.

Format: `sort=field:asc` or `sort=field:desc` (default asc)

Multiple sorts: `sort=field1:asc,field2:desc`

Common sortable fields: `created_at`, `updated_at`, `name`, `score`, `rating`

### Rate Limiting
Rate limits are enforced per user and returned in response headers:
- `X-RateLimit-Limit`: max requests per minute
- `X-RateLimit-Remaining`: requests remaining
- `X-RateLimit-Reset`: unix timestamp when limit resets

Default: 100 requests/minute per user
Matching endpoints: 1 request/minute per user
Admin endpoints: no limit

---

## Auth Module

### POST /auth/signup

Sign up a new user with email and password.

**Method:** POST

**Route:** `/auth/signup`

**Authentication:** none

**Request Schema:**
```json
{
  "email": "string (email format, required)",
  "password": "string (min 8 chars, required)",
  "displayName": "string (required, 1-100 chars)"
}
```

**Response Schema:** (201 Created)
```json
{
  "data": {
    "id": "uuid",
    "email": "string",
    "displayName": "string",
    "createdAt": "ISO 8601 timestamp"
  }
}
```

**Validation Rules:**
- Email: must be valid email format, unique across system
- Password: minimum 8 characters, at least one uppercase, one lowercase, one digit
- DisplayName: 1-100 characters, no leading/trailing whitespace

**Permissions:** anyone

**Error Responses:**
- 400: Email already registered
- 400: Password does not meet requirements
- 422: Invalid email format
- 500: Auth service unavailable

---

### POST /auth/login

Authenticate user and return JWT token.

**Method:** POST

**Route:** `/auth/login`

**Authentication:** none

**Request Schema:**
```json
{
  "email": "string (email format, required)",
  "password": "string (required)"
}
```

**Response Schema:** (200 OK)
```json
{
  "data": {
    "token": "string (JWT)",
    "expiresIn": "number (seconds)",
    "user": {
      "id": "uuid",
      "email": "string",
      "displayName": "string"
    }
  }
}
```

**Validation Rules:**
- Email: must exist in system
- Password: must match stored hash

**Permissions:** anyone

**Error Responses:**
- 401: Invalid email or password
- 429: Too many failed login attempts
- 500: Auth service unavailable

---

### POST /auth/logout

Invalidate user session (client-side token removal).

**Method:** POST

**Route:** `/auth/logout`

**Authentication:** required (Bearer token)

**Request Schema:** (empty body)

**Response Schema:** (204 No Content)

**Validation Rules:** none

**Permissions:** authenticated user

**Error Responses:**
- 401: Token invalid or expired
- 500: Unexpected error

---

### POST /auth/refresh

Refresh JWT token.

**Method:** POST

**Route:** `/auth/refresh`

**Authentication:** required (Bearer token)

**Request Schema:** (empty body)

**Response Schema:** (200 OK)
```json
{
  "data": {
    "token": "string (new JWT)",
    "expiresIn": "number (seconds)"
  }
}
```

**Validation Rules:** none

**Permissions:** authenticated user with valid token

**Error Responses:**
- 401: Token invalid or expired
- 500: Token refresh failed

---

## Profiles Module

### GET /profiles/:id

Retrieve a single profile by ID.

**Method:** GET

**Route:** `/profiles/:id`

**Authentication:** required

**Request Schema:** (no body)

**Query Parameters:** none

**Response Schema:** (200 OK)
```json
{
  "data": {
    "id": "uuid",
    "userId": "uuid",
    "displayName": "string",
    "headline": "string or null",
    "bio": "string or null",
    "roleIntent": "enum (learner|host|both)",
    "availability": "object or null",
    "location": "string or null",
    "isActive": "boolean",
    "createdAt": "ISO 8601 timestamp",
    "updatedAt": "ISO 8601 timestamp"
  }
}
```

**Validation Rules:**
- Profile ID must be valid UUID

**Permissions:**
- User can read own profile
- Any authenticated user can read other active profiles

**Error Responses:**
- 400: Invalid UUID format
- 404: Profile not found
- 401: Unauthorized

---

### GET /profiles/me

Retrieve authenticated user's own profile.

**Method:** GET

**Route:** `/profiles/me`

**Authentication:** required

**Request Schema:** (no body)

**Response Schema:** (200 OK)
```json
{
  "data": {
    "id": "uuid",
    "userId": "uuid",
    "displayName": "string",
    "headline": "string or null",
    "bio": "string or null",
    "roleIntent": "enum (learner|host|both)",
    "availability": "object or null",
    "location": "string or null",
    "isActive": "boolean",
    "createdAt": "ISO 8601 timestamp",
    "updatedAt": "ISO 8601 timestamp"
  }
}
```

**Validation Rules:** none

**Permissions:** authenticated user

**Error Responses:**
- 404: Profile not found (user not onboarded)
- 401: Unauthorized

---

### PATCH /profiles/me

Update authenticated user's profile.

**Method:** PATCH

**Route:** `/profiles/me`

**Authentication:** required

**Request Schema:**
```json
{
  "displayName": "string (optional, 1-100 chars)",
  "headline": "string (optional, max 200 chars)",
  "bio": "string (optional, max 1000 chars)",
  "roleIntent": "enum (optional, learner|host|both)",
  "availability": "object (optional, JSONB)",
  "location": "string (optional, max 200 chars)"
}
```

**Response Schema:** (200 OK)
```json
{
  "data": {
    "id": "uuid",
    "userId": "uuid",
    "displayName": "string",
    "headline": "string or null",
    "bio": "string or null",
    "roleIntent": "enum",
    "availability": "object or null",
    "location": "string or null",
    "isActive": "boolean",
    "updatedAt": "ISO 8601 timestamp"
  }
}
```

**Validation Rules:**
- DisplayName: 1-100 characters if provided
- Headline: max 200 characters
- Bio: max 1000 characters
- Location: max 200 characters
- RoleIntent: one of (learner, host, both)
- Availability: valid JSONB object

**Permissions:** user can only update own profile

**Error Responses:**
- 400: Validation error
- 401: Unauthorized
- 404: Profile not found

---

### GET /profiles

List profiles for discovery and matching.

**Method:** GET

**Route:** `/profiles`

**Authentication:** required

**Query Parameters:**
- `page`: int (default 1)
- `limit`: int (default 20, max 100)
- `roleIntent`: string (filter: learner|host|both)
- `location`: string (filter: search location)
- `search`: string (filter: search displayName or headline)
- `sort`: string (sortable: created_at, updated_at, displayName)

**Response Schema:** (200 OK)
```json
{
  "data": [
    {
      "id": "uuid",
      "userId": "uuid",
      "displayName": "string",
      "headline": "string or null",
      "bio": "string or null",
      "roleIntent": "enum",
      "location": "string or null",
      "isActive": "boolean",
      "createdAt": "ISO 8601 timestamp"
    }
  ],
  "meta": {
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 500,
      "totalPages": 25
    }
  }
}
```

**Validation Rules:**
- Page: >= 1
- Limit: 1-100
- RoleIntent: one of (learner, host, both) if provided

**Permissions:** authenticated user

**Error Responses:**
- 400: Invalid pagination or filter parameters
- 401: Unauthorized

---

## Skills Module

### GET /skills

List all skills in catalog.

**Method:** GET

**Route:** `/skills`

**Authentication:** required

**Query Parameters:**
- `page`: int (default 1)
- `limit`: int (default 50, max 200)
- `category`: string (optional, filter by category)
- `search`: string (optional, search skill name)
- `sort`: string (sortable: name, created_at)

**Response Schema:** (200 OK)
```json
{
  "data": [
    {
      "id": "uuid",
      "name": "string",
      "slug": "string",
      "category": "string or null",
      "createdAt": "ISO 8601 timestamp"
    }
  ],
  "meta": {
    "pagination": {
      "page": 1,
      "limit": 50,
      "total": 250,
      "totalPages": 5
    }
  }
}
```

**Validation Rules:**
- Page: >= 1
- Limit: 1-200

**Permissions:** authenticated user

**Error Responses:**
- 400: Invalid pagination parameters
- 401: Unauthorized

---

### GET /skills/:id

Retrieve a single skill.

**Method:** GET

**Route:** `/skills/:id`

**Authentication:** required

**Request Schema:** (no body)

**Response Schema:** (200 OK)
```json
{
  "data": {
    "id": "uuid",
    "name": "string",
    "slug": "string",
    "category": "string or null",
    "createdAt": "ISO 8601 timestamp"
  }
}
```

**Validation Rules:**
- ID must be valid UUID

**Permissions:** authenticated user

**Error Responses:**
- 400: Invalid UUID
- 404: Skill not found
- 401: Unauthorized

---

### POST /user-skills

Declare a skill for authenticated user.

**Method:** POST

**Route:** `/user-skills`

**Authentication:** required

**Request Schema:**
```json
{
  "skillId": "uuid (required)",
  "proficiency": "int (required, 1-5)",
  "role": "enum (required, teach|learn|both)"
}
```

**Response Schema:** (201 Created)
```json
{
  "data": {
    "id": "uuid",
    "userId": "uuid",
    "skillId": "uuid",
    "proficiency": "int",
    "role": "enum",
    "createdAt": "ISO 8601 timestamp"
  }
}
```

**Validation Rules:**
- SkillId: must be valid UUID and exist
- Proficiency: 1-5 integer
- Role: one of (teach, learn, both)
- Unique constraint: (userId, skillId, role) cannot duplicate

**Permissions:** user can only add skills to own profile

**Error Responses:**
- 400: Validation error (skill not found, invalid proficiency)
- 409: Duplicate user-skill entry
- 401: Unauthorized
- 404: User profile not found

---

### GET /user-skills/me

List authenticated user's skills.

**Method:** GET

**Route:** `/user-skills/me`

**Authentication:** required

**Query Parameters:**
- `role`: string (optional, filter: teach|learn|both)
- `sort`: string (sortable: proficiency, created_at)

**Response Schema:** (200 OK)
```json
{
  "data": [
    {
      "id": "uuid",
      "userId": "uuid",
      "skillId": "uuid",
      "proficiency": "int",
      "role": "enum",
      "createdAt": "ISO 8601 timestamp",
      "skill": {
        "id": "uuid",
        "name": "string",
        "slug": "string"
      }
    }
  ]
}
```

**Validation Rules:**
- Role: one of (teach, learn, both) if provided

**Permissions:** user can only read own skills

**Error Responses:**
- 400: Invalid filter parameters
- 401: Unauthorized
- 404: User profile not found

---

### PATCH /user-skills/:id

Update proficiency of a user skill.

**Method:** PATCH

**Route:** `/user-skills/:id`

**Authentication:** required

**Request Schema:**
```json
{
  "proficiency": "int (required, 1-5)"
}
```

**Response Schema:** (200 OK)
```json
{
  "data": {
    "id": "uuid",
    "userId": "uuid",
    "skillId": "uuid",
    "proficiency": "int",
    "role": "enum",
    "updatedAt": "ISO 8601 timestamp"
  }
}
```

**Validation Rules:**
- Proficiency: 1-5 integer

**Permissions:** user can only update own skills

**Error Responses:**
- 400: Invalid proficiency value
- 401: Unauthorized
- 404: User skill not found

---

### DELETE /user-skills/:id

Remove a skill from user profile.

**Method:** DELETE

**Route:** `/user-skills/:id`

**Authentication:** required

**Request Schema:** (no body)

**Response Schema:** (204 No Content)

**Validation Rules:** none

**Permissions:** user can only delete own skills

**Error Responses:**
- 401: Unauthorized
- 404: User skill not found

---

## Learning Goals Module

### POST /learning-goals

Create a learning goal for authenticated user.

**Method:** POST

**Route:** `/learning-goals`

**Authentication:** required

**Request Schema:**
```json
{
  "title": "string (required, 1-200 chars)",
  "description": "string (optional, max 1000 chars)",
  "skillId": "uuid (optional)",
  "priority": "int (optional, 1-5, default 1)"
}
```

**Response Schema:** (201 Created)
```json
{
  "data": {
    "id": "uuid",
    "userId": "uuid",
    "title": "string",
    "description": "string or null",
    "skillId": "uuid or null",
    "status": "enum (active)",
    "priority": "int",
    "createdAt": "ISO 8601 timestamp",
    "updatedAt": "ISO 8601 timestamp"
  }
}
```

**Validation Rules:**
- Title: 1-200 characters
- Description: max 1000 characters if provided
- SkillId: must be valid UUID and exist if provided
- Priority: 1-5 if provided

**Permissions:** user creates own goals

**Error Responses:**
- 400: Validation error
- 404: Skill not found (if skillId provided)
- 401: Unauthorized

---

### GET /learning-goals/me

List authenticated user's learning goals.

**Method:** GET

**Route:** `/learning-goals/me`

**Authentication:** required

**Query Parameters:**
- `page`: int (default 1)
- `limit`: int (default 20, max 100)
- `status`: string (filter: active|paused|completed)
- `sort`: string (sortable: priority, created_at, updated_at)

**Response Schema:** (200 OK)
```json
{
  "data": [
    {
      "id": "uuid",
      "userId": "uuid",
      "title": "string",
      "description": "string or null",
      "skillId": "uuid or null",
      "status": "enum",
      "priority": "int",
      "createdAt": "ISO 8601 timestamp",
      "updatedAt": "ISO 8601 timestamp",
      "skill": {
        "id": "uuid",
        "name": "string",
        "slug": "string"
      }
    }
  ],
  "meta": {
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 15,
      "totalPages": 1
    }
  }
}
```

**Validation Rules:**
- Status: one of (active, paused, completed) if provided

**Permissions:** user can only read own goals

**Error Responses:**
- 400: Invalid parameters
- 401: Unauthorized

---

### PATCH /learning-goals/:id

Update a learning goal.

**Method:** PATCH

**Route:** `/learning-goals/:id`

**Authentication:** required

**Request Schema:**
```json
{
  "title": "string (optional, 1-200 chars)",
  "description": "string (optional, max 1000 chars)",
  "skillId": "uuid (optional)",
  "priority": "int (optional, 1-5)",
  "status": "enum (optional, active|paused|completed)"
}
```

**Response Schema:** (200 OK)
```json
{
  "data": {
    "id": "uuid",
    "userId": "uuid",
    "title": "string",
    "description": "string or null",
    "skillId": "uuid or null",
    "status": "enum",
    "priority": "int",
    "updatedAt": "ISO 8601 timestamp"
  }
}
```

**Validation Rules:**
- Title: 1-200 characters if provided
- Description: max 1000 characters if provided
- SkillId: must exist if provided
- Priority: 1-5 if provided
- Status: one of (active, paused, completed) if provided

**Permissions:** user can only update own goals

**Error Responses:**
- 400: Validation error
- 401: Unauthorized
- 404: Goal not found

---

### DELETE /learning-goals/:id

Delete a learning goal.

**Method:** DELETE

**Route:** `/learning-goals/:id`

**Authentication:** required

**Request Schema:** (no body)

**Response Schema:** (204 No Content)

**Validation Rules:** none

**Permissions:** user can only delete own goals

**Error Responses:**
- 401: Unauthorized
- 404: Goal not found

---

## Matches Module

### POST /matches

Request a match with another user.

**Method:** POST

**Route:** `/matches`

**Authentication:** required

**Request Schema:**
```json
{
  "candidateId": "uuid (required)",
  "goalId": "uuid (optional)"
}
```

**Response Schema:** (201 Created)
```json
{
  "data": {
    "id": "uuid",
    "requesterId": "uuid",
    "candidateId": "uuid",
    "goalId": "uuid or null",
    "status": "enum (pending)",
    "score": "number or null",
    "reason": "string or null",
    "createdAt": "ISO 8601 timestamp",
    "updatedAt": "ISO 8601 timestamp"
  }
}
```

**Validation Rules:**
- CandidateId: must be valid UUID and exist
- GoalId: must be valid UUID and belong to requester if provided
- CandidateId cannot equal requesterId
- Unique constraint: (requesterId, candidateId, goalId)

**Permissions:** user creates match for self

**Error Responses:**
- 400: Validation error (self-match, invalid ID)
- 409: Duplicate match exists
- 404: Candidate or goal not found
- 401: Unauthorized

---

### GET /matches/me

List authenticated user's matches (as requester and candidate).

**Method:** GET

**Route:** `/matches/me`

**Authentication:** required

**Query Parameters:**
- `page`: int (default 1)
- `limit`: int (default 20, max 100)
- `status`: string (filter: pending|accepted|declined|cancelled|expired)
- `role`: string (filter: requester|candidate|all, default all)
- `sort`: string (sortable: score, created_at)

**Response Schema:** (200 OK)
```json
{
  "data": [
    {
      "id": "uuid",
      "requesterId": "uuid",
      "candidateId": "uuid",
      "goalId": "uuid or null",
      "status": "enum",
      "score": "number or null",
      "reason": "string or null",
      "createdAt": "ISO 8601 timestamp",
      "requester": {
        "id": "uuid",
        "displayName": "string",
        "headline": "string or null"
      },
      "candidate": {
        "id": "uuid",
        "displayName": "string",
        "headline": "string or null"
      }
    }
  ],
  "meta": {
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 25,
      "totalPages": 2
    }
  }
}
```

**Validation Rules:**
- Status: one of (pending, accepted, declined, cancelled, expired) if provided
- Role: one of (requester, candidate, all) if provided

**Permissions:** user can only read matches involving them

**Error Responses:**
- 400: Invalid parameters
- 401: Unauthorized

---

### PATCH /matches/:id

Update match status (accept or decline).

**Method:** PATCH

**Route:** `/matches/:id`

**Authentication:** required

**Request Schema:**
```json
{
  "status": "enum (required, accepted|declined|cancelled)"
}
```

**Response Schema:** (200 OK)
```json
{
  "data": {
    "id": "uuid",
    "requesterId": "uuid",
    "candidateId": "uuid",
    "goalId": "uuid or null",
    "status": "enum",
    "score": "number or null",
    "updatedAt": "ISO 8601 timestamp"
  }
}
```

**Validation Rules:**
- Status: one of (accepted, declined, cancelled)
- User must be requester or candidate

**Permissions:**
- Candidate can accept/decline
- Requester can cancel

**Error Responses:**
- 400: Invalid status or invalid state transition
- 401: Unauthorized
- 403: User not involved in match
- 404: Match not found

---

### GET /matches/recommendations

Generate match recommendations for authenticated user.

**Method:** GET

**Route:** `/matches/recommendations`

**Authentication:** required

**Query Parameters:**
- `limit`: int (default 10, max 50)
- `skill`: string (optional, filter by skill)
- `location`: string (optional, filter by location)

**Response Schema:** (200 OK)
```json
{
  "data": [
    {
      "id": "uuid",
      "requesterId": "uuid",
      "candidateId": "uuid",
      "goalId": "uuid or null",
      "status": "enum (pending)",
      "score": "number",
      "reason": "string",
      "createdAt": "ISO 8601 timestamp",
      "candidate": {
        "id": "uuid",
        "displayName": "string",
        "headline": "string or null",
        "reputation": "number",
        "completedSessions": "int"
      }
    }
  ]
}
```

**Validation Rules:**
- Limit: 1-50

**Permissions:** user generates recommendations for self

**Error Responses:**
- 400: Invalid parameters
- 401: Unauthorized
- 429: Rate limited (1 request/minute)

---

## Sessions Module

### POST /sessions

Create an exchange session.

**Method:** POST

**Route:** `/sessions`

**Authentication:** required

**Request Schema:**
```json
{
  "matchId": "uuid (optional)",
  "participantIds": "array of uuids (required)",
  "title": "string (required, 1-200 chars)",
  "description": "string (optional, max 1000 chars)",
  "scheduledAt": "ISO 8601 timestamp (optional)",
  "durationMinutes": "int (optional, > 0)"
}
```

**Response Schema:** (201 Created)
```json
{
  "data": {
    "id": "uuid",
    "matchId": "uuid or null",
    "ownerId": "uuid",
    "title": "string",
    "description": "string or null",
    "scheduledAt": "ISO 8601 timestamp or null",
    "durationMinutes": "int or null",
    "status": "enum (scheduled)",
    "verificationStatus": "enum (unverified)",
    "confirmationToken": "string",
    "createdAt": "ISO 8601 timestamp",
    "updatedAt": "ISO 8601 timestamp"
  }
}
```

**Validation Rules:**
- MatchId: optional, must exist if provided
- ParticipantIds: non-empty array, all must exist, cannot include owner
- Title: 1-200 characters
- Description: max 1000 characters if provided
- DurationMinutes: positive integer if provided

**Permissions:** user creates session and becomes owner

**Error Responses:**
- 400: Validation error
- 401: Unauthorized
- 404: Match, participant, or owner not found

---

### GET /sessions/me

List authenticated user's sessions.

**Method:** GET

**Route:** `/sessions/me`

**Authentication:** required

**Query Parameters:**
- `page`: int (default 1)
- `limit`: int (default 20, max 100)
- `status`: string (filter: scheduled|confirmed|in_progress|completed|cancelled|no_show)
- `role`: string (filter: owner|participant, default all)
- `sort`: string (sortable: scheduled_at, created_at)

**Response Schema:** (200 OK)
```json
{
  "data": [
    {
      "id": "uuid",
      "matchId": "uuid or null",
      "ownerId": "uuid",
      "title": "string",
      "description": "string or null",
      "scheduledAt": "ISO 8601 timestamp or null",
      "durationMinutes": "int or null",
      "status": "enum",
      "verificationStatus": "enum",
      "createdAt": "ISO 8601 timestamp",
      "updatedAt": "ISO 8601 timestamp",
      "owner": {
        "id": "uuid",
        "displayName": "string"
      },
      "participants": [
        {
          "id": "uuid",
          "userId": "uuid",
          "role": "enum (host|learner|observer)",
          "confirmed": "boolean",
          "displayName": "string"
        }
      ]
    }
  ],
  "meta": {
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 8,
      "totalPages": 1
    }
  }
}
```

**Validation Rules:**
- Status: valid session status if provided
- Role: one of (owner, participant) if provided

**Permissions:** user can only see sessions they own or participate in

**Error Responses:**
- 400: Invalid parameters
- 401: Unauthorized

---

### PATCH /sessions/:id

Update session status.

**Method:** PATCH

**Route:** `/sessions/:id`

**Authentication:** required

**Request Schema:**
```json
{
  "status": "enum (confirmed|in_progress|completed|cancelled|no_show)",
  "verificationStatus": "enum (optional, verified|disputed)"
}
```

**Response Schema:** (200 OK)
```json
{
  "data": {
    "id": "uuid",
    "status": "enum",
    "verificationStatus": "enum",
    "updatedAt": "ISO 8601 timestamp"
  }
}
```

**Validation Rules:**
- Status: valid next state for current status
- VerificationStatus: optional, valid enum value

**Permissions:** session owner can update status

**Error Responses:**
- 400: Invalid status transition
- 401: Unauthorized
- 403: User is not session owner
- 404: Session not found

---

### POST /sessions/:id/participants

Confirm participant attendance.

**Method:** POST

**Route:** `/sessions/:id/participants`

**Authentication:** required

**Request Schema:**
```json
{
  "confirmationToken": "string (optional, for external verification)"
}
```

**Response Schema:** (200 OK)
```json
{
  "data": {
    "id": "uuid",
    "sessionId": "uuid",
    "userId": "uuid",
    "role": "enum",
    "confirmed": "boolean (true)",
    "joinedAt": "ISO 8601 timestamp",
    "updatedAt": "ISO 8601 timestamp"
  }
}
```

**Validation Rules:**
- User must be participant in session

**Permissions:** participant can only confirm self

**Error Responses:**
- 400: Invalid confirmation token
- 401: Unauthorized
- 404: Session or participant not found

---

## Reviews Module

### POST /sessions/:id/reviews

Submit a review for a session.

**Method:** POST

**Route:** `/sessions/:id/reviews`

**Authentication:** required

**Request Schema:**
```json
{
  "revieweeId": "uuid (required)",
  "rating": "int (required, 1-5)",
  "comments": "string (optional, max 500 chars)"
}
```

**Response Schema:** (201 Created)
```json
{
  "data": {
    "id": "uuid",
    "sessionId": "uuid",
    "reviewerId": "uuid",
    "revieweeId": "uuid",
    "rating": "int",
    "comments": "string or null",
    "status": "enum (published)",
    "createdAt": "ISO 8601 timestamp",
    "updatedAt": "ISO 8601 timestamp"
  }
}
```

**Validation Rules:**
- RevieweeId: must be participant in session and different from reviewer
- Rating: 1-5 integer
- Comments: max 500 characters if provided
- Unique constraint: (sessionId, reviewerId, revieweeId)

**Permissions:** session participant can review other participants

**Error Responses:**
- 400: Validation error
- 409: Review already submitted
- 401: Unauthorized
- 404: Session, reviewer, or reviewee not found

---

### GET /sessions/:id/reviews

List reviews for a session.

**Method:** GET

**Route:** `/sessions/:id/reviews`

**Authentication:** required

**Query Parameters:**
- `status`: string (filter: draft|published|flagged|removed)

**Response Schema:** (200 OK)
```json
{
  "data": [
    {
      "id": "uuid",
      "sessionId": "uuid",
      "reviewerId": "uuid",
      "revieweeId": "uuid",
      "rating": "int",
      "comments": "string or null",
      "status": "enum",
      "createdAt": "ISO 8601 timestamp",
      "reviewer": {
        "id": "uuid",
        "displayName": "string"
      },
      "reviewee": {
        "id": "uuid",
        "displayName": "string"
      }
    }
  ]
}
```

**Validation Rules:**
- Status: valid review status if provided

**Permissions:** authenticated user can read session reviews

**Error Responses:**
- 400: Invalid parameters
- 401: Unauthorized
- 404: Session not found

---

### PATCH /reviews/:id

Update review (for moderation).

**Method:** PATCH

**Route:** `/reviews/:id`

**Authentication:** required

**Request Schema:**
```json
{
  "status": "enum (optional, draft|published|flagged|removed)",
  "comments": "string (optional, max 500 chars)"
}
```

**Response Schema:** (200 OK)
```json
{
  "data": {
    "id": "uuid",
    "status": "enum",
    "comments": "string or null",
    "updatedAt": "ISO 8601 timestamp"
  }
}
```

**Validation Rules:**
- Status: valid review status if provided
- Comments: max 500 characters if provided

**Permissions:**
- Reviewer can edit own review (draft/published)
- Admin can flag or remove reviews

**Error Responses:**
- 400: Invalid status
- 401: Unauthorized
- 403: User cannot edit this review
- 404: Review not found

---

## Reputation Module

### GET /reputation/me

Retrieve authenticated user's reputation score.

**Method:** GET

**Route:** `/reputation/me`

**Authentication:** required

**Request Schema:** (no body)

**Response Schema:** (200 OK)
```json
{
  "data": {
    "id": "uuid",
    "userId": "uuid",
    "score": "number (0-150)",
    "reviewCount": "int",
    "completedSessions": "int",
    "updatedAt": "ISO 8601 timestamp"
  }
}
```

**Validation Rules:** none

**Permissions:** user can read own reputation

**Error Responses:**
- 401: Unauthorized
- 404: Reputation not found

---

### GET /reputation/:userId

Retrieve another user's reputation score.

**Method:** GET

**Route:** `/reputation/:userId`

**Authentication:** required

**Request Schema:** (no body)

**Response Schema:** (200 OK)
```json
{
  "data": {
    "id": "uuid",
    "userId": "uuid",
    "score": "number (0-150)",
    "reviewCount": "int",
    "completedSessions": "int",
    "updatedAt": "ISO 8601 timestamp"
  }
}
```

**Validation Rules:**
- UserId: valid UUID

**Permissions:** authenticated user can read any reputation

**Error Responses:**
- 400: Invalid UUID
- 401: Unauthorized
- 404: Reputation not found

---

### GET /reputation/leaderboard

Get top reputation users.

**Method:** GET

**Route:** `/reputation/leaderboard`

**Authentication:** required

**Query Parameters:**
- `limit`: int (default 10, max 100)
- `timeframe`: string (all|month|week, default all)

**Response Schema:** (200 OK)
```json
{
  "data": [
    {
      "rank": "int",
      "userId": "uuid",
      "displayName": "string",
      "score": "number",
      "reviewCount": "int",
      "completedSessions": "int"
    }
  ]
}
```

**Validation Rules:**
- Limit: 1-100
- Timeframe: one of (all, month, week)

**Permissions:** authenticated user

**Error Responses:**
- 400: Invalid parameters
- 401: Unauthorized

---

## Contribution Module

### GET /contribution/me

Retrieve authenticated user's contribution balance.

**Method:** GET

**Route:** `/contribution/me`

**Authentication:** required

**Request Schema:** (no body)

**Response Schema:** (200 OK)
```json
{
  "data": {
    "id": "uuid",
    "userId": "uuid",
    "balance": "number (decimal, >= 0)",
    "updatedAt": "ISO 8601 timestamp"
  }
}
```

**Validation Rules:** none

**Permissions:** user can only read own balance

**Error Responses:**
- 401: Unauthorized
- 404: Contribution balance not found

---

### GET /contribution/me/transactions

List authenticated user's contribution transactions.

**Method:** GET

**Route:** `/contribution/me/transactions`

**Authentication:** required

**Query Parameters:**
- `page`: int (default 1)
- `limit`: int (default 20, max 100)
- `type`: string (filter: earned|redeemed|adjustment)
- `status`: string (filter: posted|pending|reversed)
- `sort`: string (sortable: created_at, amount)

**Response Schema:** (200 OK)
```json
{
  "data": [
    {
      "id": "uuid",
      "balanceId": "uuid",
      "sessionId": "uuid or null",
      "userId": "uuid",
      "amount": "number (decimal)",
      "type": "enum",
      "reference": "string or null",
      "status": "enum",
      "createdAt": "ISO 8601 timestamp"
    }
  ],
  "meta": {
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 35,
      "totalPages": 2
    }
  }
}
```

**Validation Rules:**
- Type: one of (earned, redeemed, adjustment) if provided
- Status: one of (posted, pending, reversed) if provided

**Permissions:** user can only read own transactions

**Error Responses:**
- 400: Invalid parameters
- 401: Unauthorized

---

### POST /contribution/redeem

Redeem contribution points.

**Method:** POST

**Route:** `/contribution/redeem`

**Authentication:** required

**Request Schema:**
```json
{
  "amount": "number (required, > 0)",
  "reason": "string (required, 1-200 chars)"
}
```

**Response Schema:** (201 Created)
```json
{
  "data": {
    "id": "uuid",
    "transactionId": "uuid",
    "userId": "uuid",
    "amount": "number",
    "newBalance": "number",
    "createdAt": "ISO 8601 timestamp"
  }
}
```

**Validation Rules:**
- Amount: positive decimal
- Reason: 1-200 characters
- Balance must be >= amount

**Permissions:** user redeems own balance

**Error Responses:**
- 400: Validation error
- 409: Insufficient balance
- 401: Unauthorized

---

## NEXOS Module

### GET /nexos/me

Retrieve authenticated user's NEXOS wallet.

**Method:** GET

**Route:** `/nexos/me`

**Authentication:** required

**Request Schema:** (no body)

**Response Schema:** (200 OK)
```json
{
  "data": {
    "id": "uuid",
    "userId": "uuid",
    "balance": "number (decimal, >= 0)",
    "updatedAt": "ISO 8601 timestamp"
  }
}
```

**Validation Rules:** none

**Permissions:** user can only read own wallet

**Error Responses:**
- 401: Unauthorized
- 404: NEXOS wallet not found

---

### GET /nexos/me/transactions

List authenticated user's NEXOS transactions.

**Method:** GET

**Route:** `/nexos/me/transactions`

**Authentication:** required

**Query Parameters:**
- `page`: int (default 1)
- `limit`: int (default 20, max 100)
- `type`: string (filter: session_reward|internal_transfer|spend|adjustment)
- `status`: string (filter: posted|pending|reversed)
- `sort`: string (sortable: created_at, amount)

**Response Schema:** (200 OK)
```json
{
  "data": [
    {
      "id": "uuid",
      "walletId": "uuid",
      "sessionId": "uuid or null",
      "userId": "uuid",
      "amount": "number (decimal)",
      "type": "enum",
      "reference": "string or null",
      "status": "enum",
      "createdAt": "ISO 8601 timestamp"
    }
  ],
  "meta": {
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 50,
      "totalPages": 3
    }
  }
}
```

**Validation Rules:**
- Type: valid transaction type if provided
- Status: valid transaction status if provided

**Permissions:** user can only read own transactions

**Error Responses:**
- 400: Invalid parameters
- 401: Unauthorized

---

### POST /nexos/transfer

Transfer NEXOS to another user.

**Method:** POST

**Route:** `/nexos/transfer`

**Authentication:** required

**Request Schema:**
```json
{
  "recipientId": "uuid (required)",
  "amount": "number (required, > 0)"
}
```

**Response Schema:** (201 Created)
```json
{
  "data": {
    "id": "uuid",
    "senderId": "uuid",
    "recipientId": "uuid",
    "amount": "number",
    "senderNewBalance": "number",
    "recipientNewBalance": "number",
    "createdAt": "ISO 8601 timestamp",
    "senderTransaction": {
      "id": "uuid",
      "type": "spend"
    },
    "recipientTransaction": {
      "id": "uuid",
      "type": "receive"
    }
  }
}
```

**Validation Rules:**
- RecipientId: must be valid UUID and exist
- Amount: positive decimal
- Recipient cannot be sender
- Sender balance must be >= amount

**Permissions:** user transfers own NEXOS

**Error Responses:**
- 400: Validation error (invalid recipient, amount <= 0)
- 409: Insufficient balance or recipient not found
- 401: Unauthorized

---

### POST /nexos/spend

Spend NEXOS on features or items.

**Method:** POST

**Route:** `/nexos/spend`

**Authentication:** required

**Request Schema:**
```json
{
  "amount": "number (required, > 0)",
  "item": "string (required, item identifier)",
  "reference": "string (optional, order reference)"
}
```

**Response Schema:** (201 Created)
```json
{
  "data": {
    "id": "uuid",
    "transactionId": "uuid",
    "userId": "uuid",
    "amount": "number",
    "item": "string",
    "newBalance": "number",
    "createdAt": "ISO 8601 timestamp"
  }
}
```

**Validation Rules:**
- Amount: positive decimal
- Item: recognized item identifier
- Balance must be >= amount

**Permissions:** user spends own NEXOS

**Error Responses:**
- 400: Validation error (invalid item, amount <= 0)
- 409: Insufficient balance
- 401: Unauthorized

---

## Admin Module

### GET /admin/audit-logs

Retrieve audit logs (admin only).

**Method:** GET

**Route:** `/admin/audit-logs`

**Authentication:** required

**Query Parameters:**
- `page`: int (default 1)
- `limit`: int (default 50, max 200)
- `entity`: string (filter: profile|session|review|etc.)
- `action`: string (filter: create|update|delete|flag|resolve)
- `actor`: uuid (filter by actor user ID)
- `created_after`: ISO 8601 timestamp
- `created_before`: ISO 8601 timestamp
- `sort`: string (sortable: created_at, action)

**Response Schema:** (200 OK)
```json
{
  "data": [
    {
      "id": "uuid",
      "actorId": "uuid or null",
      "entity": "string",
      "entityId": "uuid or null",
      "action": "enum",
      "details": "object or null",
      "createdAt": "ISO 8601 timestamp",
      "actor": {
        "id": "uuid",
        "displayName": "string"
      }
    }
  ],
  "meta": {
    "pagination": {
      "page": 1,
      "limit": 50,
      "total": 1000,
      "totalPages": 20
    }
  }
}
```

**Validation Rules:**
- Page: >= 1
- Limit: 1-200
- Entity, action, dates must be valid if provided

**Permissions:** admin/audit role only

**Error Responses:**
- 400: Invalid parameters
- 401: Unauthorized
- 403: Insufficient permissions

---

### PATCH /admin/reviews/:id

Flag or remove a review (moderation).

**Method:** PATCH

**Route:** `/admin/reviews/:id`

**Authentication:** required

**Request Schema:**
```json
{
  "status": "enum (required, flagged|removed)",
  "reason": "string (required, 1-500 chars)"
}
```

**Response Schema:** (200 OK)
```json
{
  "data": {
    "id": "uuid",
    "status": "enum",
    "updatedAt": "ISO 8601 timestamp"
  }
}
```

**Validation Rules:**
- Status: one of (flagged, removed)
- Reason: 1-500 characters

**Permissions:** admin/moderation role only

**Error Responses:**
- 400: Invalid status or reason
- 401: Unauthorized
- 403: Insufficient permissions
- 404: Review not found

---

### PATCH /admin/sessions/:id/verify

Verify or dispute a session (admin override).

**Method:** PATCH

**Route:** `/admin/sessions/:id/verify`

**Authentication:** required

**Request Schema:**
```json
{
  "verificationStatus": "enum (required, verified|disputed)",
  "reason": "string (optional, 1-500 chars)"
}
```

**Response Schema:** (200 OK)
```json
{
  "data": {
    "id": "uuid",
    "verificationStatus": "enum",
    "updatedAt": "ISO 8601 timestamp"
  }
}
```

**Validation Rules:**
- VerificationStatus: one of (verified, disputed)
- Reason: 1-500 characters if provided

**Permissions:** admin role only

**Error Responses:**
- 400: Invalid status
- 401: Unauthorized
- 403: Insufficient permissions
- 404: Session not found

---

### POST /admin/adjustments/contribution

Adjust user contribution balance (admin override).

**Method:** POST

**Route:** `/admin/adjustments/contribution`

**Authentication:** required

**Request Schema:**
```json
{
  "userId": "uuid (required)",
  "amount": "number (required, can be negative)",
  "reason": "string (required, 1-500 chars)"
}
```

**Response Schema:** (201 Created)
```json
{
  "data": {
    "id": "uuid",
    "transactionId": "uuid",
    "userId": "uuid",
    "amount": "number",
    "newBalance": "number",
    "reason": "string",
    "createdAt": "ISO 8601 timestamp"
  }
}
```

**Validation Rules:**
- UserId: valid UUID and exists
- Amount: non-zero number
- Reason: 1-500 characters

**Permissions:** admin role only

**Error Responses:**
- 400: Validation error
- 401: Unauthorized
- 403: Insufficient permissions
- 404: User not found

---

### POST /admin/adjustments/nexos

Adjust user NEXOS wallet balance (admin override).

**Method:** POST

**Route:** `/admin/adjustments/nexos`

**Authentication:** required

**Request Schema:**
```json
{
  "userId": "uuid (required)",
  "amount": "number (required, can be negative)",
  "reason": "string (required, 1-500 chars)"
}
```

**Response Schema:** (201 Created)
```json
{
  "data": {
    "id": "uuid",
    "transactionId": "uuid",
    "userId": "uuid",
    "amount": "number",
    "newBalance": "number",
    "reason": "string",
    "createdAt": "ISO 8601 timestamp"
  }
}
```

**Validation Rules:**
- UserId: valid UUID and exists
- Amount: non-zero number
- Reason: 1-500 characters

**Permissions:** admin role only

**Error Responses:**
- 400: Validation error
- 401: Unauthorized
- 403: Insufficient permissions
- 404: User not found

---

## Rate Limiting

All endpoints are subject to rate limiting with the following defaults:

### Rate Limits by Endpoint Group
- General endpoints: 100 requests/minute per user
- Matching endpoints: 1 request/minute per user (high computational cost)
- Session settlement: 5 requests/minute per user
- Admin endpoints: no limit

### Rate Limit Headers
All responses include rate limit headers:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1717545600
```

When rate limit is exceeded:
```
HTTP 429 Too Many Requests

{
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Too many requests. Please try again later.",
    "details": {
      "retryAfter": 42
    }
  }
}
```

---

## Error Responses

### Standard Error Format
```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message",
    "details": {
      /* optional context */
    }
  }
}
```

### Common Error Codes

| Code | HTTP Status | Meaning |
|------|-------------|---------|
| `VALIDATION_ERROR` | 400 | Request validation failed |
| `INVALID_REQUEST` | 400 | Malformed request |
| `UNAUTHORIZED` | 401 | Missing or invalid authentication |
| `FORBIDDEN` | 403 | Insufficient permissions |
| `NOT_FOUND` | 404 | Resource not found |
| `CONFLICT` | 409 | Business rule violation |
| `DUPLICATE_ENTRY` | 409 | Unique constraint violation |
| `INSUFFICIENT_BALANCE` | 409 | Balance insufficient |
| `INVALID_STATE_TRANSITION` | 422 | Invalid status change |
| `RATE_LIMIT_EXCEEDED` | 429 | Rate limit hit |
| `INTERNAL_SERVER_ERROR` | 500 | Server error |

---

## Pagination

All list endpoints support pagination via query parameters:

- `page`: integer, >= 1 (default 1)
- `limit`: integer, 1-100 (default 20)

### Pagination Response
```json
{
  "data": [ /* items */ ],
  "meta": {
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 500,
      "totalPages": 25
    }
  }
}
```

### Pagination Behavior
- If page > totalPages, returns empty array
- If limit > 100, capped to 100
- If page < 1, defaults to 1

---

## Filtering

List endpoints support filtering via query parameters specific to each resource.

### Common Filter Patterns
- `status`: comma-separated enum values (e.g., `?status=active,completed`)
- `search`: free-text search on name/title/description fields
- `created_after`: ISO 8601 timestamp (e.g., `?created_after=2026-06-01T00:00:00Z`)
- `created_before`: ISO 8601 timestamp

### Combining Filters
Filters are AND-ed together:
```
GET /profiles?roleIntent=host&location=New%20York&search=python
```

---

## Sorting

List endpoints support sorting via `sort` query parameter.

### Sort Format
- Single field: `?sort=created_at:asc`
- Multiple fields: `?sort=created_at:desc,name:asc`
- Default: ascending (asc)

### Sortable Fields
Each endpoint documents its sortable fields. Common ones:
- `created_at`: creation timestamp
- `updated_at`: last update timestamp
- `name`: alphabetical field
- `score`: numeric field
- `rating`: numeric rating

---

## API Versioning

Current API version: v1

All endpoints are versioned via URL path: `/api/v1/*`

Future versions (e.g., v2) will maintain backward compatibility or provide migration guidance.

---

## Webhook Events (Future)

MVP V1 does not include webhooks. Post-MVP features:
- Session completed events
- Match created events
- Review submitted events
- Reputation updated events

Webhooks will be managed separately via admin panel configuration.

---

## SDK / Client Libraries

Official clients will be provided for:
- JavaScript/TypeScript (Node.js and browser)
- Python
- React hooks

---

## API Documentation Tools

- OpenAPI/Swagger specification: available at `/api/v1/spec`
- Interactive API explorer: available at `/api/v1/docs`

This specification is versioned and changes are communicated via changelog.

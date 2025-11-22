# AYAZMA-ONE API Documentation

## Base URL

```
Development: http://localhost:3001/api
Production: https://api.ayazmaone.com/api
```

## Authentication

All API requests require authentication using Supabase JWT tokens.

### Headers

```http
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: application/json
```

---

## Agents API

### Start Agent Run

Start a new agent run for a project.

**Endpoint**: `POST /agents/run`

**Request Body**:

```json
{
  "agentName": "design_spec" | "workflow_designer" | "content_strategist" | "orchestrator",
  "projectId": "uuid-string",
  "context": {
    "wizardAnswers": {
      "projectName": "string",
      "sector": "string",
      "projectType": "string",
      "description": "string"
    }
  }
}
```

**Response**:

```json
{
  "success": true,
  "data": {
    "runId": "uuid-string"
  }
}
```

---

### List Agent Runs

Get all agent runs, optionally filtered by project.

**Endpoint**: `GET /agents/runs?projectId={projectId}`

**Query Parameters**:

- `projectId` (optional): Filter by project ID

**Response**:

```json
{
  "success": true,
  "data": [
    {
      "id": "uuid-string",
      "agentName": "design_spec",
      "status": "succeeded" | "failed" | "running" | "pending",
      "projectId": "uuid-string",
      "createdAt": "2025-11-22T10:00:00Z",
      "updatedAt": "2025-11-22T10:00:30Z"
    }
  ]
}
```

---

### Get Agent Run Details

Get detailed information about a specific agent run, including all artifacts.

**Endpoint**: `GET /agents/runs/{runId}`

**Response**:

```json
{
  "success": true,
  "data": {
    "run": {
      "id": "uuid-string",
      "agentName": "design_spec",
      "status": "succeeded",
      "projectId": "uuid-string",
      "createdAt": "2025-11-22T10:00:00Z",
      "updatedAt": "2025-11-22T10:00:30Z"
    },
    "artifacts": [
      {
        "id": "uuid-string",
        "type": "plan",
        "title": "High-Level App Spec",
        "content": "markdown content here...",
        "meta": {
          "provider": "google",
          "model": "gemini-2.5-flash",
          "usage": {
            "inputTokens": 1500,
            "outputTokens": 3000,
            "totalTokens": 4500,
            "latencyMs": 2500
          }
        },
        "createdAt": "2025-11-22T10:00:30Z"
      }
    ]
  }
}
```

---

## Projects API

### Create Project

Create a new project.

**Endpoint**: `POST /projects`

**Request Body**:

```json
{
  "name": "string",
  "description": "string",
  "sector": "string",
  "projectType": "saas" | "web_app" | "mobile_app" | "media" | "hybrid"
}
```

**Response**:

```json
{
  "success": true,
  "data": {
    "id": "uuid-string",
    "name": "string",
    "description": "string",
    "sector": "string",
    "project_type": "saas",
    "status": "draft",
    "user_id": "uuid-string",
    "created_at": "2025-11-22T10:00:00Z",
    "updated_at": "2025-11-22T10:00:00Z"
  }
}
```

---

### Get Projects

Get all projects for the authenticated user.

**Endpoint**: `GET /projects`

**Response**:

```json
{
  "success": true,
  "data": [
    {
      "id": "uuid-string",
      "name": "string",
      "description": "string",
      "sector": "string",
      "project_type": "saas",
      "status": "draft",
      "user_id": "uuid-string",
      "created_at": "2025-11-22T10:00:00Z",
      "updated_at": "2025-11-22T10:00:00Z"
    }
  ]
}
```

---

### Get Project

Get a specific project by ID.

**Endpoint**: `GET /projects/{projectId}`

**Response**:

```json
{
  "success": true,
  "data": {
    "id": "uuid-string",
    "name": "string",
    "description": "string",
    "sector": "string",
    "project_type": "saas",
    "status": "draft",
    "user_id": "uuid-string",
    "created_at": "2025-11-22T10:00:00Z",
    "updated_at": "2025-11-22T10:00:00Z"
  }
}
```

---

## Telemetry API

### Get User AI Usage Summary

Get AI usage statistics for the authenticated user.

**Endpoint**: `GET /telemetry/ai/summary?days={days}`

**Query Parameters**:

- `days` (optional): Number of days to include (default: 30)

**Response**:

```json
{
  "success": true,
  "data": {
    "totalCalls": 45,
    "totalTokens": 125000,
    "avgLatencyMs": 2500,
    "byProject": [
      {
        "projectId": "uuid-string",
        "totalCalls": 15,
        "totalTokens": 50000,
        "avgLatencyMs": 2400
      }
    ]
  }
}
```

---

### Get Project AI Usage Summary

Get AI usage statistics for a specific project.

**Endpoint**: `GET /telemetry/ai/summary?projectId={projectId}&days={days}`

**Query Parameters**:

- `projectId`: Project ID
- `days` (optional): Number of days to include (default: 30)

**Response**:

```json
{
  "success": true,
  "data": {
    "projectId": "uuid-string",
    "totalCalls": 15,
    "totalTokens": 50000,
    "avgLatencyMs": 2400,
    "byProvider": [
      {
        "provider": "google",
        "model": "gemini-2.5-flash",
        "taskType": "app_spec_suggestion",
        "totalCalls": 5,
        "totalTokens": 20000,
        "avgLatencyMs": 2500
      }
    ],
    "byTaskType": [
      {
        "provider": "google",
        "model": "gemini-2.5-flash",
        "taskType": "app_spec_suggestion",
        "totalCalls": 5,
        "totalTokens": 20000,
        "avgLatencyMs": 2500
      }
    ]
  }
}
```

---

## Error Responses

All API endpoints follow a consistent error format:

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message"
  }
}
```

### Common Error Codes

- `UNAUTHORIZED` - Missing or invalid authentication token
- `FORBIDDEN` - User doesn't have permission to access the resource
- `NOT_FOUND` - Resource not found
- `VALIDATION_ERROR` - Request validation failed
- `AGENT_NOT_FOUND` - Specified agent doesn't exist
- `PROJECT_NOT_FOUND` - Specified project doesn't exist
- `AI_PROVIDER_ERROR` - AI service encountered an error
- `INTERNAL_ERROR` - Server error

---

## Rate Limits

- **Per User**: 200 requests/minute
- **Per IP**: 300 requests/minute

Rate limit headers:

```http
X-RateLimit-Limit: 200
X-RateLimit-Remaining: 195
X-RateLimit-Reset: 1732262400
```

---

## Webhooks

Coming soon! Webhook support for agent run completion events.

---

**API Version**: 1.0  
**Last Updated**: November 2025

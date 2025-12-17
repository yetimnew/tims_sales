# API Documentation - TIMS

This directory contains comprehensive API documentation for the Transport Information Management System (TIMS).

## 📚 Files in This Directory

- **[README.md](./README.md)** - This file: Complete API reference documentation

## 📖 Overview

This document provides comprehensive API documentation for the Transport Information Management System (TIMS), including all endpoints, authentication, request/response formats, and examples.

## 📋 Table of Contents

1. [API Overview](#1-api-overview)
2. [Authentication](#2-authentication)
3. [Base URL and Endpoints](#3-base-url-and-endpoints)
4. [Request/Response Format](#4-requestresponse-format)
5. [Error Handling](#5-error-handling)
6. [Trucks API](#6-trucks-api)
7. [Drivers API](#7-drivers-api)
8. [Vehicle Types API](#8-vehicle-types-api)
9. [Performance API](#9-performance-api)
10. [Financial Records API](#10-financial-records-api)
11. [Maintenance API](#11-maintenance-api)
12. [Fuel Records API](#12-fuel-records-api)
13. [Geographic API](#13-geographic-api)
14. [User Management API](#14-user-management-api)
15. [Permissions API](#15-permissions-api)
16. [Activity Log API](#16-activity-log-api)
17. [Rate Limiting](#17-rate-limiting)
18. [SDK Examples](#18-sdk-examples)

---

## 1. API Overview

### 1.1 Introduction

The TIMS API provides RESTful endpoints for managing transport operations, fleet management, and related data. The API follows REST conventions and returns JSON responses.

### 1.2 Features

- **RESTful Design**: Standard HTTP methods and status codes
- **JSON Responses**: All responses in JSON format
- **Authentication**: Token-based authentication
- **Pagination**: Built-in pagination for list endpoints
- **Filtering**: Search and filter capabilities
- **Sorting**: Multi-column sorting support
- **Rate Limiting**: API rate limiting for security
- **Versioning**: API versioning support
- **Documentation**: Comprehensive API documentation

### 1.3 Base Information

- **Base URL**: `https://api.tims.com/v1`
- **Protocol**: HTTPS
- **Format**: JSON
- **Character Encoding**: UTF-8
- **Date Format**: ISO 8601 (YYYY-MM-DDTHH:mm:ssZ)

## 2. Authentication

### 2.1 Authentication Methods

#### Personal Access Tokens
```http
Authorization: Bearer {access_token}
```

#### Session Authentication
```http
Cookie: laravel_session={session_token}
```

### 2.2 Getting Access Tokens

#### Login Endpoint
```http
POST /auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password"
}
```

#### Response
```json
{
  "success": true,
  "data": {
    "user": {
      "id": 1,
      "name": "John Doe",
      "email": "user@example.com",
      "email_verified_at": "2024-01-01T00:00:00Z",
      "created_at": "2024-01-01T00:00:00Z",
      "updated_at": "2024-01-01T00:00:00Z"
    },
    "token": "1|abcdefghijklmnopqrstuvwxyz1234567890"
  },
  "message": "Login successful"
}
```

### 2.3 Token Management

#### Create Personal Access Token
```http
POST /auth/tokens
Authorization: Bearer {access_token}
Content-Type: application/json

{
  "name": "My API Token",
  "abilities": ["trucks.view", "trucks.create"]
}
```

#### List Personal Access Tokens
```http
GET /auth/tokens
Authorization: Bearer {access_token}
```

#### Revoke Personal Access Token
```http
DELETE /auth/tokens/{token_id}
Authorization: Bearer {access_token}
```

## 3. Base URL and Endpoints

### 3.1 Base URL

```
Production: https://api.tims.com/v1
Staging: https://staging-api.tims.com/v1
Development: http://localhost:8000/api/v1
```

### 3.2 Endpoint Structure

```
{base_url}/{resource}/{id?}/{action?}
```

#### Examples
```
GET    /trucks                    # List trucks
POST   /trucks                    # Create truck
GET    /trucks/{id}               # Show truck
PUT    /trucks/{id}               # Update truck
DELETE /trucks/{id}               # Delete truck
GET    /trucks/export             # Export trucks
```

## 4. Request/Response Format

### 4.1 Request Format

#### Headers
```http
Content-Type: application/json
Accept: application/json
Authorization: Bearer {access_token}
```

#### Request Body
```json
{
  "plate": "AA1234BB",
  "vehicletype_id": "uuid",
  "chasisNumber": "CHASIS123456",
  "engineNumber": "ENGINE123456",
  "tyreSyze": "225/75R16",
  "serviceIntervalKM": 10000,
  "purchasePrice": 1500000,
  "productionDate": "2020-01-01",
  "serviceStartDate": "2020-02-01",
  "status": "active"
}
```

### 4.2 Response Format

#### Success Response
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "plate": "AA1234BB",
    "vehicletype_id": "uuid",
    "chasisNumber": "CHASIS123456",
    "engineNumber": "ENGINE123456",
    "tyreSyze": "225/75R16",
    "serviceIntervalKM": 10000,
    "purchasePrice": 1500000,
    "productionDate": "2020-01-01T00:00:00Z",
    "serviceStartDate": "2020-02-01T00:00:00Z",
    "status": "active",
    "created_at": "2024-01-01T00:00:00Z",
    "updated_at": "2024-01-01T00:00:00Z"
  },
  "message": "Truck created successfully"
}
```

#### Error Response
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "The given data was invalid",
    "details": {
      "plate": ["The plate field is required"],
      "chasisNumber": ["The chassis number field is required"]
    }
  }
}
```

### 4.3 Pagination

#### Paginated Response
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "plate": "AA1234BB",
      "status": "active"
    }
  ],
  "links": {
    "first": "https://api.tims.com/v1/trucks?page=1",
    "last": "https://api.tims.com/v1/trucks?page=10",
    "prev": null,
    "next": "https://api.tims.com/v1/trucks?page=2"
  },
  "meta": {
    "current_page": 1,
    "from": 1,
    "last_page": 10,
    "per_page": 15,
    "to": 15,
    "total": 150
  }
}
```

## 5. Error Handling

### 5.1 HTTP Status Codes

| Code | Description |
|------|-------------|
| 200 | OK - Request successful |
| 201 | Created - Resource created successfully |
| 204 | No Content - Request successful, no content returned |
| 400 | Bad Request - Invalid request data |
| 401 | Unauthorized - Authentication required |
| 403 | Forbidden - Insufficient permissions |
| 404 | Not Found - Resource not found |
| 422 | Unprocessable Entity - Validation errors |
| 429 | Too Many Requests - Rate limit exceeded |
| 500 | Internal Server Error - Server error |

### 5.2 Error Response Format

#### Validation Error
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "The given data was invalid",
    "details": {
      "plate": ["The plate field is required"],
      "chasisNumber": ["The chassis number field is required"]
    }
  }
}
```

#### Authentication Error
```json
{
  "success": false,
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Authentication required"
  }
}
```

#### Permission Error
```json
{
  "success": false,
  "error": {
    "code": "FORBIDDEN",
    "message": "Insufficient permissions"
  }
}
```

#### Not Found Error
```json
{
  "success": false,
  "error": {
    "code": "NOT_FOUND",
    "message": "Resource not found"
  }
}
```

## 6. Trucks API

### 6.1 List Trucks

#### Endpoint
```http
GET /trucks
```

#### Parameters
| Parameter | Type | Description | Example |
|-----------|------|-------------|---------|
| `search` | string | Search query | `AA1234` |
| `sort` | string | Sort field | `plate` |
| `direction` | string | Sort direction | `asc` or `desc` |
| `page` | integer | Page number | `1` |
| `per_page` | integer | Items per page | `15` |

#### Example Request
```http
GET /trucks?search=AA1234&sort=plate&direction=asc&page=1&per_page=15
Authorization: Bearer {access_token}
```

#### Example Response
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "plate": "AA1234BB",
      "vehicletype": {
        "id": "uuid",
        "name": "Heavy Truck",
        "description": "Large cargo truck"
      },
      "chasisNumber": "CHASIS123456",
      "engineNumber": "ENGINE123456",
      "tyreSyze": "225/75R16",
      "serviceIntervalKM": 10000,
      "purchasePrice": 1500000,
      "productionDate": "2020-01-01T00:00:00Z",
      "serviceStartDate": "2020-02-01T00:00:00Z",
      "status": "active",
      "created_at": "2024-01-01T00:00:00Z",
      "updated_at": "2024-01-01T00:00:00Z"
    }
  ],
  "links": {
    "first": "https://api.tims.com/v1/trucks?page=1",
    "last": "https://api.tims.com/v1/trucks?page=10",
    "prev": null,
    "next": "https://api.tims.com/v1/trucks?page=2"
  },
  "meta": {
    "current_page": 1,
    "from": 1,
    "last_page": 10,
    "per_page": 15,
    "to": 15,
    "total": 150
  }
}
```

### 6.2 Create Truck

#### Endpoint
```http
POST /trucks
```

#### Request Body
```json
{
  "plate": "AA1234BB",
  "vehicletype_id": "uuid",
  "chasisNumber": "CHASIS123456",
  "engineNumber": "ENGINE123456",
  "tyreSyze": "225/75R16",
  "serviceIntervalKM": 10000,
  "purchasePrice": 1500000,
  "productionDate": "2020-01-01",
  "serviceStartDate": "2020-02-01",
  "status": "active"
}
```

#### Validation Rules
| Field | Rules | Description |
|-------|-------|-------------|
| `plate` | required, string, max:255, unique | License plate number |
| `vehicletype_id` | required, uuid, exists:vehicle_types,id | Vehicle type reference |
| `chasisNumber` | required, string, max:255, unique | Chassis number |
| `engineNumber` | required, string, max:255, unique | Engine number |
| `tyreSyze` | required, string, max:20 | Tyre size specification |
| `serviceIntervalKM` | required, integer, min:1000, max:100000 | Service interval in kilometers |
| `purchasePrice` | required, numeric, min:0 | Purchase price in ETB |
| `productionDate` | required, date, before:today | Production date |
| `serviceStartDate` | required, date, after_or_equal:productionDate | Service start date |
| `status` | required, string, in:active,inactive,maintenance,retired | Truck status |

#### Example Response
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "plate": "AA1234BB",
    "vehicletype_id": "uuid",
    "chasisNumber": "CHASIS123456",
    "engineNumber": "ENGINE123456",
    "tyreSyze": "225/75R16",
    "serviceIntervalKM": 10000,
    "purchasePrice": 1500000,
    "productionDate": "2020-01-01T00:00:00Z",
    "serviceStartDate": "2020-02-01T00:00:00Z",
    "status": "active",
    "created_at": "2024-01-01T00:00:00Z",
    "updated_at": "2024-01-01T00:00:00Z"
  },
  "message": "Truck created successfully"
}
```

### 6.3 Show Truck

#### Endpoint
```http
GET /trucks/{id}
```

#### Example Request
```http
GET /trucks/uuid
Authorization: Bearer {access_token}
```

#### Example Response
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "plate": "AA1234BB",
    "vehicletype": {
      "id": "uuid",
      "name": "Heavy Truck",
      "description": "Large cargo truck"
    },
    "chasisNumber": "CHASIS123456",
    "engineNumber": "ENGINE123456",
    "tyreSyze": "225/75R16",
    "serviceIntervalKM": 10000,
    "purchasePrice": 1500000,
    "productionDate": "2020-01-01T00:00:00Z",
    "serviceStartDate": "2020-02-01T00:00:00Z",
    "status": "active",
    "maintenanceRecords": [
      {
        "id": "uuid",
        "maintenance_type": {
          "name": "Oil Change",
          "description": "Regular oil change"
        },
        "service_date": "2024-01-01T00:00:00Z",
        "cost": 5000,
        "description": "Regular maintenance",
        "status": "completed"
      }
    ],
    "fuelRecords": [
      {
        "id": "uuid",
        "date": "2024-01-01T00:00:00Z",
        "liters": 100,
        "cost_per_liter": 50,
        "total_cost": 5000,
        "odometer_reading": 100000
      }
    ],
    "financialRecords": [
      {
        "id": "uuid",
        "record_date": "2024-01-01T00:00:00Z",
        "revenue": 50000,
        "expenses": 30000,
        "profit_loss": 20000
      }
    ],
    "drivers": [
      {
        "id": "uuid",
        "name": "John Doe",
        "driverid": "DRV001",
        "status": "active",
        "pivot": {
          "assigned_date": "2024-01-01T00:00:00Z",
          "status": "active"
        }
      }
    ],
    "created_at": "2024-01-01T00:00:00Z",
    "updated_at": "2024-01-01T00:00:00Z"
  }
}
```

### 6.4 Update Truck

#### Endpoint
```http
PUT /trucks/{id}
```

#### Request Body
```json
{
  "plate": "AA1234BB",
  "vehicletype_id": "uuid",
  "chasisNumber": "CHASIS123456",
  "engineNumber": "ENGINE123456",
  "tyreSyze": "225/75R16",
  "serviceIntervalKM": 15000,
  "purchasePrice": 1500000,
  "productionDate": "2020-01-01",
  "serviceStartDate": "2020-02-01",
  "status": "active"
}
```

#### Example Response
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "plate": "AA1234BB",
    "vehicletype_id": "uuid",
    "chasisNumber": "CHASIS123456",
    "engineNumber": "ENGINE123456",
    "tyreSyze": "225/75R16",
    "serviceIntervalKM": 15000,
    "purchasePrice": 1500000,
    "productionDate": "2020-01-01T00:00:00Z",
    "serviceStartDate": "2020-02-01T00:00:00Z",
    "status": "active",
    "created_at": "2024-01-01T00:00:00Z",
    "updated_at": "2024-01-01T00:00:00Z"
  },
  "message": "Truck updated successfully"
}
```

### 6.5 Delete Truck

#### Endpoint
```http
DELETE /trucks/{id}
```

#### Example Request
```http
DELETE /trucks/uuid
Authorization: Bearer {access_token}
```

#### Example Response
```json
{
  "success": true,
  "message": "Truck deleted successfully"
}
```

### 6.6 Export Trucks

#### Endpoint
```http
GET /trucks/export
```

#### Parameters
| Parameter | Type | Description | Example |
|-----------|------|-------------|---------|
| `search` | string | Search query | `AA1234` |
| `sort` | string | Sort field | `plate` |
| `direction` | string | Sort direction | `asc` or `desc` |

#### Example Request
```http
GET /trucks/export?search=AA1234&sort=plate&direction=asc
Authorization: Bearer {access_token}
```

#### Response
- **Content-Type**: `text/csv`
- **Content-Disposition**: `attachment; filename="trucks_2024-01-01_12-00-00.csv"`

## 7. Drivers API

### 7.1 List Drivers

#### Endpoint
```http
GET /drivers
```

#### Parameters
| Parameter | Type | Description | Example |
|-----------|------|-------------|---------|
| `search` | string | Search query | `John` |
| `sort` | string | Sort field | `name` |
| `direction` | string | Sort direction | `asc` or `desc` |
| `page` | integer | Page number | `1` |
| `per_page` | integer | Items per page | `15` |

#### Example Response
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "driverid": "DRV001",
      "name": "John Doe",
      "sex": "male",
      "birthdate": "1990-01-01T00:00:00Z",
      "zone": "Addise Ababa",
      "woreda": "Bole",
      "kebele": "01",
      "housenumber": "123",
      "mobile": "+251911234567",
      "hireddate": "2020-01-01T00:00:00Z",
      "status": "active",
      "created_at": "2024-01-01T00:00:00Z",
      "updated_at": "2024-01-01T00:00:00Z"
    }
  ],
  "links": {
    "first": "https://api.tims.com/v1/drivers?page=1",
    "last": "https://api.tims.com/v1/drivers?page=10",
    "prev": null,
    "next": "https://api.tims.com/v1/drivers?page=2"
  },
  "meta": {
    "current_page": 1,
    "from": 1,
    "last_page": 10,
    "per_page": 15,
    "to": 15,
    "total": 150
  }
}
```

### 7.2 Create Driver

#### Endpoint
```http
POST /drivers
```

#### Request Body
```json
{
  "driverid": "DRV001",
  "name": "John Doe",
  "sex": "male",
  "birthdate": "1990-01-01",
  "zone": "Addise Ababa",
  "woreda": "Bole",
  "kebele": "01",
  "housenumber": "123",
  "mobile": "+251911234567",
  "hireddate": "2020-01-01",
  "status": "active"
}
```

#### Validation Rules
| Field | Rules | Description |
|-------|-------|-------------|
| `driverid` | required, string, max:255, unique | Driver ID |
| `name` | required, string, max:255 | Driver full name |
| `sex` | required, string, in:male,female | Driver gender |
| `birthdate` | required, date, before:today | Driver birth date |
| `zone` | required, string, max:255 | Driver zone |
| `woreda` | required, string, max:255 | Driver woreda |
| `kebele` | required, string, max:255 | Driver kebele |
| `housenumber` | required, string, max:255 | House number |
| `mobile` | required, string, max:255 | Mobile phone number |
| `hireddate` | required, date, before:today | Hire date |
| `status` | required, string, in:active,inactive,suspended | Driver status |

### 7.3 Show Driver

#### Endpoint
```http
GET /drivers/{id}
```

#### Example Response
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "driverid": "DRV001",
    "name": "John Doe",
    "sex": "male",
    "birthdate": "1990-01-01T00:00:00Z",
    "zone": "Addise Ababa",
    "woreda": "Bole",
    "kebele": "01",
    "housenumber": "123",
    "mobile": "+251911234567",
    "hireddate": "2020-01-01T00:00:00Z",
    "status": "active",
    "performanceRecords": [
      {
        "id": "uuid",
        "record_date": "2024-01-01T00:00:00Z",
        "total_trips": 50,
        "total_distance_km": 5000,
        "total_cargo_tonnage": 100,
        "fuel_efficiency": 8.5,
        "safety_violations": 0,
        "accidents": 0,
        "customer_rating": 4.5,
        "period_type": "monthly"
      }
    ],
    "safetyRecords": [
      {
        "id": "uuid",
        "incident_date": "2024-01-01T00:00:00Z",
        "incident_type": "accident",
        "description": "Minor collision",
        "severity": "low",
        "damage_cost": 5000,
        "location": "Addise Ababa",
        "resolution": "Repaired"
      }
    ],
    "trucks": [
      {
        "id": "uuid",
        "plate": "AA1234BB",
        "status": "active",
        "pivot": {
          "assigned_date": "2024-01-01T00:00:00Z",
          "status": "active"
        }
      }
    ],
    "created_at": "2024-01-01T00:00:00Z",
    "updated_at": "2024-01-01T00:00:00Z"
  }
}
```

## 8. Vehicle Types API

### 8.1 List Vehicle Types

#### Endpoint
```http
GET /vehicle-types
```

#### Example Response
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "name": "Heavy Truck",
      "description": "Large cargo truck",
      "created_at": "2024-01-01T00:00:00Z",
      "updated_at": "2024-01-01T00:00:00Z"
    },
    {
      "id": "uuid",
      "name": "Light Truck",
      "description": "Small delivery truck",
      "created_at": "2024-01-01T00:00:00Z",
      "updated_at": "2024-01-01T00:00:00Z"
    }
  ]
}
```

### 8.2 Create Vehicle Type

#### Endpoint
```http
POST /vehicle-types
```

#### Request Body
```json
{
  "name": "Heavy Truck",
  "description": "Large cargo truck"
}
```

#### Validation Rules
| Field | Rules | Description |
|-------|-------|-------------|
| `name` | required, string, max:255, unique | Vehicle type name |
| `description` | nullable, string | Vehicle type description |

## 9. Performance API

### 9.1 List Performances

#### Endpoint
```http
GET /performances
```

#### Parameters
| Parameter | Type | Description | Example |
|-----------|------|-------------|---------|
| `search` | string | Search query | `FO1234` |
| `sort` | string | Sort field | `DateDispach` |
| `direction` | string | Sort direction | `asc` or `desc` |
| `page` | integer | Page number | `1` |
| `per_page` | integer | Items per page | `15` |

#### Example Response
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "trip": 1,
      "LoadType": "Full Load",
      "FOnumber": "FO1234",
      "operation": {
        "id": "uuid",
        "operation": "Transport Operation",
        "customer": {
          "name": "Customer Name",
          "contact_person": "Contact Person"
        }
      },
      "driverTruck": {
        "driver": {
          "name": "John Doe",
          "driverid": "DRV001"
        },
        "truck": {
          "plate": "AA1234BB"
        }
      },
      "DateDispach": "2024-01-01T00:00:00Z",
      "origin": {
        "name": "Addise Ababa",
        "code": "ADD"
      },
      "destination": {
        "name": "Dire Dawa",
        "code": "DIR"
      },
      "DistanceWCargo": 500,
      "tonkm": 1000,
      "DistanceWOCargo": 50,
      "CargoVolumMT": 20,
      "fuelInLitter": 100,
      "fuelInBirr": 5000,
      "perdiem": 1000,
      "workOnGoing": false,
      "other": 500,
      "comment": "Trip completed successfully",
      "satus": "completed",
      "is_returned": true,
      "created_at": "2024-01-01T00:00:00Z",
      "updated_at": "2024-01-01T00:00:00Z"
    }
  ],
  "links": {
    "first": "https://api.tims.com/v1/performances?page=1",
    "last": "https://api.tims.com/v1/performances?page=10",
    "prev": null,
    "next": "https://api.tims.com/v1/performances?page=2"
  },
  "meta": {
    "current_page": 1,
    "from": 1,
    "last_page": 10,
    "per_page": 15,
    "to": 15,
    "total": 150
  }
}
```

### 9.2 Create Performance

#### Endpoint
```http
POST /performances
```

#### Request Body
```json
{
  "trip": 1,
  "LoadType": "Full Load",
  "FOnumber": "FO1234",
  "operation_id": "uuid",
  "driver_truck_id": "uuid",
  "DateDispach": "2024-01-01",
  "orgion_id": "uuid",
  "destination_id": "uuid",
  "user_id": "uuid",
  "DistanceWCargo": 500,
  "tonkm": 1000,
  "DistanceWOCargo": 50,
  "CargoVolumMT": 20,
  "fuelInLitter": 100,
  "fuelInBirr": 5000,
  "perdiem": 1000,
  "workOnGoing": false,
  "other": 500,
  "comment": "Trip completed successfully",
  "satus": "completed",
  "is_returned": true
}
```

## 10. Financial Records API

### 10.1 List Financial Records

#### Endpoint
```http
GET /financial-records
```

#### Example Response
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "truck": {
        "id": "uuid",
        "plate": "AA1234BB"
      },
      "record_date": "2024-01-01T00:00:00Z",
      "revenue": 50000,
      "fuel_cost": 15000,
      "maintenance_cost": 5000,
      "driver_cost": 10000,
      "other_costs": 5000,
      "total_costs": 35000,
      "net_profit": 15000,
      "profit_margin": 30,
      "period_type": "monthly",
      "notes": "Monthly financial summary",
      "created_at": "2024-01-01T00:00:00Z",
      "updated_at": "2024-01-01T00:00:00Z"
    }
  ]
}
```

### 10.2 Create Financial Record

#### Endpoint
```http
POST /financial-records
```

#### Request Body
```json
{
  "truck_id": "uuid",
  "record_date": "2024-01-01",
  "revenue": 50000,
  "fuel_cost": 15000,
  "maintenance_cost": 5000,
  "driver_cost": 10000,
  "other_costs": 5000,
  "period_type": "monthly",
  "notes": "Monthly financial summary"
}
```

## 11. Maintenance API

### 11.1 List Maintenance Records

#### Endpoint
```http
GET /maintenance-records
```

#### Example Response
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "truck": {
        "id": "uuid",
        "plate": "AA1234BB"
      },
      "maintenance_type": {
        "id": "uuid",
        "name": "Oil Change",
        "description": "Regular oil change"
      },
      "scheduled_date": "2024-01-01T00:00:00Z",
      "completed_date": "2024-01-01T00:00:00Z",
      "cost": 5000,
      "description": "Regular maintenance",
      "status": "completed",
      "notes": "Maintenance completed successfully",
      "created_at": "2024-01-01T00:00:00Z",
      "updated_at": "2024-01-01T00:00:00Z"
    }
  ]
}
```

### 11.2 Create Maintenance Record

#### Endpoint
```http
POST /maintenance-records
```

#### Request Body
```json
{
  "truck_id": "uuid",
  "maintenance_type_id": "uuid",
  "scheduled_date": "2024-01-01",
  "cost": 5000,
  "description": "Regular maintenance",
  "status": "scheduled",
  "notes": "Scheduled maintenance"
}
```

## 12. Fuel Records API

### 12.1 List Fuel Records

#### Endpoint
```http
GET /fuel-records
```

#### Example Response
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "truck": {
        "id": "uuid",
        "plate": "AA1234BB"
      },
      "driver": {
        "id": "uuid",
        "name": "John Doe",
        "driverid": "DRV001"
      },
      "date": "2024-01-01T00:00:00Z",
      "liters": 100,
      "cost_per_liter": 50,
      "total_cost": 5000,
      "odometer_reading": 100000,
      "fuel_type": "Diesel",
      "station_name": "Shell Station",
      "receipt_number": "RCP001",
      "created_at": "2024-01-01T00:00:00Z",
      "updated_at": "2024-01-01T00:00:00Z"
    }
  ]
}
```

### 12.2 Create Fuel Record

#### Endpoint
```http
POST /fuel-records
```

#### Request Body
```json
{
  "truck_id": "uuid",
  "driver_id": "uuid",
  "date": "2024-01-01",
  "liters": 100,
  "cost_per_liter": 50,
  "odometer_reading": 100000,
  "fuel_type": "Diesel",
  "station_name": "Shell Station",
  "receipt_number": "RCP001"
}
```

## 13. Geographic API

### 13.1 List Regions

#### Endpoint
```http
GET /regions
```

#### Example Response
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "name": "ADDISE ABABA",
      "code": "ADD",
      "description": "ADDISE ABABA REGION",
      "zones": [
        {
          "id": "uuid",
          "name": "Bole",
          "code": "BOL",
          "description": "Bole Zone"
        }
      ],
      "created_at": "2024-01-01T00:00:00Z",
      "updated_at": "2024-01-01T00:00:00Z"
    }
  ]
}
```

### 13.2 List Zones

#### Endpoint
```http
GET /zones
```

#### Parameters
| Parameter | Type | Description | Example |
|-----------|------|-------------|---------|
| `region_id` | uuid | Filter by region | `uuid` |

### 13.3 List Woredas

#### Endpoint
```http
GET /woredas
```

#### Parameters
| Parameter | Type | Description | Example |
|-----------|------|-------------|---------|
| `zone_id` | uuid | Filter by zone | `uuid` |

### 13.4 List Places

#### Endpoint
```http
GET /places
```

#### Parameters
| Parameter | Type | Description | Example |
|-----------|------|-------------|---------|
| `woreda_id` | uuid | Filter by woreda | `uuid` |

## 14. User Management API

### 14.1 List Users

#### Endpoint
```http
GET /users
```

#### Example Response
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "name": "John Doe",
      "email": "john@example.com",
      "email_verified_at": "2024-01-01T00:00:00Z",
      "roles": [
        {
          "id": "uuid",
          "name": "admin",
          "permissions": [
            {
              "id": "uuid",
              "name": "trucks.view"
            },
            {
              "id": "uuid",
              "name": "trucks.create"
            }
          ]
        }
      ],
      "created_at": "2024-01-01T00:00:00Z",
      "updated_at": "2024-01-01T00:00:00Z"
    }
  ]
}
```

### 14.2 Create User

#### Endpoint
```http
POST /users
```

#### Request Body
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password",
  "password_confirmation": "password",
  "roles": ["admin"]
}
```

## 15. Permissions API

### 15.1 List Permissions

#### Endpoint
```http
GET /permissions
```

#### Example Response
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "name": "trucks.view",
      "guard_name": "web",
      "created_at": "2024-01-01T00:00:00Z",
      "updated_at": "2024-01-01T00:00:00Z"
    },
    {
      "id": "uuid",
      "name": "trucks.create",
      "guard_name": "web",
      "created_at": "2024-01-01T00:00:00Z",
      "updated_at": "2024-01-01T00:00:00Z"
    }
  ]
}
```

### 15.2 List Roles

#### Endpoint
```http
GET /roles
```

#### Example Response
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "name": "admin",
      "guard_name": "web",
      "permissions": [
        {
          "id": "uuid",
          "name": "trucks.view"
        },
        {
          "id": "uuid",
          "name": "trucks.create"
        }
      ],
      "created_at": "2024-01-01T00:00:00Z",
      "updated_at": "2024-01-01T00:00:00Z"
    }
  ]
}
```

## 16. Activity Log API

### 16.1 List Activity Logs

#### Endpoint
```http
GET /activity-logs
```

#### Parameters
| Parameter | Type | Description | Example |
|-----------|------|-------------|---------|
| `subject_type` | string | Filter by subject type | `App\Models\Truck` |
| `subject_id` | uuid | Filter by subject ID | `uuid` |
| `causer_id` | uuid | Filter by causer ID | `uuid` |
| `log_name` | string | Filter by log name | `default` |
| `page` | integer | Page number | `1` |
| `per_page` | integer | Items per page | `15` |

#### Example Response
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "log_name": "default",
      "description": "created",
      "subject_type": "App\\Models\\Truck",
      "subject_id": "uuid",
      "causer_type": "App\\Models\\User",
      "causer_id": "uuid",
      "properties": {
        "old": null,
        "new": {
          "plate": "AA1234BB",
          "status": "active"
        }
      },
      "created_at": "2024-01-01T00:00:00Z",
      "updated_at": "2024-01-01T00:00:00Z",
      "causer": {
        "id": "uuid",
        "name": "John Doe",
        "email": "john@example.com"
      }
    }
  ],
  "links": {
    "first": "https://api.tims.com/v1/activity-logs?page=1",
    "last": "https://api.tims.com/v1/activity-logs?page=10",
    "prev": null,
    "next": "https://api.tims.com/v1/activity-logs?page=2"
  },
  "meta": {
    "current_page": 1,
    "from": 1,
    "last_page": 10,
    "per_page": 15,
    "to": 15,
    "total": 150
  }
}
```

## 17. Rate Limiting

### 17.1 Rate Limits

| Endpoint Type | Limit | Window |
|---------------|-------|--------|
| Authentication | 5 requests | 1 minute |
| API Endpoints | 100 requests | 1 minute |
| Export Endpoints | 10 requests | 1 minute |

### 17.2 Rate Limit Headers

#### Response Headers
```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 99
X-RateLimit-Reset: 1640995200
```

#### Rate Limit Exceeded Response
```json
{
  "success": false,
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Too many requests"
  }
}
```

## 18. SDK Examples

### 18.1 JavaScript/Node.js

#### Installation
```bash
npm install axios
```

#### Example Usage
```javascript
const axios = require('axios');

const api = axios.create({
  baseURL: 'https://api.tims.com/v1',
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
});

// Add token to requests
api.interceptors.request.use(config => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// List trucks
async function getTrucks() {
  try {
    const response = await api.get('/trucks');
    return response.data;
  } catch (error) {
    console.error('Error fetching trucks:', error.response.data);
    throw error;
  }
}

// Create truck
async function createTruck(truckData) {
  try {
    const response = await api.post('/trucks', truckData);
    return response.data;
  } catch (error) {
    console.error('Error creating truck:', error.response.data);
    throw error;
  }
}

// Update truck
async function updateTruck(id, truckData) {
  try {
    const response = await api.put(`/trucks/${id}`, truckData);
    return response.data;
  } catch (error) {
    console.error('Error updating truck:', error.response.data);
    throw error;
  }
}

// Delete truck
async function deleteTruck(id) {
  try {
    const response = await api.delete(`/trucks/${id}`);
    return response.data;
  } catch (error) {
    console.error('Error deleting truck:', error.response.data);
    throw error;
  }
}

// Export trucks
async function exportTrucks(filters = {}) {
  try {
    const response = await api.get('/trucks/export', {
      params: filters,
      responseType: 'blob'
    });
    
    // Create download link
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'trucks.csv');
    document.body.appendChild(link);
    link.click();
    link.remove();
  } catch (error) {
    console.error('Error exporting trucks:', error.response.data);
    throw error;
  }
}
```

### 18.2 PHP

#### Installation
```bash
composer require guzzlehttp/guzzle
```

#### Example Usage
```php
<?php

use GuzzleHttp\Client;
use GuzzleHttp\Exception\RequestException;

class TimsApiClient
{
    private $client;
    private $baseUrl;
    private $accessToken;

    public function __construct($baseUrl = 'https://api.tims.com/v1', $accessToken = null)
    {
        $this->baseUrl = $baseUrl;
        $this->accessToken = $accessToken;
        $this->client = new Client([
            'base_uri' => $this->baseUrl,
            'headers' => [
                'Content-Type' => 'application/json',
                'Accept' => 'application/json',
            ]
        ]);
    }

    public function setAccessToken($token)
    {
        $this->accessToken = $token;
    }

    private function getHeaders()
    {
        $headers = [];
        if ($this->accessToken) {
            $headers['Authorization'] = 'Bearer ' . $this->accessToken;
        }
        return $headers;
    }

    public function getTrucks($filters = [])
    {
        try {
            $response = $this->client->get('/trucks', [
                'headers' => $this->getHeaders(),
                'query' => $filters
            ]);
            return json_decode($response->getBody(), true);
        } catch (RequestException $e) {
            throw new Exception('Error fetching trucks: ' . $e->getMessage());
        }
    }

    public function createTruck($data)
    {
        try {
            $response = $this->client->post('/trucks', [
                'headers' => $this->getHeaders(),
                'json' => $data
            ]);
            return json_decode($response->getBody(), true);
        } catch (RequestException $e) {
            throw new Exception('Error creating truck: ' . $e->getMessage());
        }
    }

    public function updateTruck($id, $data)
    {
        try {
            $response = $this->client->put("/trucks/{$id}", [
                'headers' => $this->getHeaders(),
                'json' => $data
            ]);
            return json_decode($response->getBody(), true);
        } catch (RequestException $e) {
            throw new Exception('Error updating truck: ' . $e->getMessage());
        }
    }

    public function deleteTruck($id)
    {
        try {
            $response = $this->client->delete("/trucks/{$id}", [
                'headers' => $this->getHeaders()
            ]);
            return json_decode($response->getBody(), true);
        } catch (RequestException $e) {
            throw new Exception('Error deleting truck: ' . $e->getMessage());
        }
    }

    public function exportTrucks($filters = [])
    {
        try {
            $response = $this->client->get('/trucks/export', [
                'headers' => $this->getHeaders(),
                'query' => $filters
            ]);
            return $response->getBody();
        } catch (RequestException $e) {
            throw new Exception('Error exporting trucks: ' . $e->getMessage());
        }
    }
}

// Usage example
$api = new TimsApiClient('https://api.tims.com/v1', 'your-access-token');

// List trucks
$trucks = $api->getTrucks(['search' => 'AA1234', 'sort' => 'plate']);

// Create truck
$newTruck = $api->createTruck([
    'plate' => 'AA1234BB',
    'vehicletype_id' => 'uuid',
    'chasisNumber' => 'CHASIS123456',
    'engineNumber' => 'ENGINE123456',
    'tyreSyze' => '225/75R16',
    'serviceIntervalKM' => 10000,
    'purchasePrice' => 1500000,
    'productionDate' => '2020-01-01',
    'serviceStartDate' => '2020-02-01',
    'status' => 'active'
]);

// Update truck
$updatedTruck = $api->updateTruck('uuid', [
    'serviceIntervalKM' => 15000
]);

// Delete truck
$result = $api->deleteTruck('uuid');

// Export trucks
$csvData = $api->exportTrucks(['search' => 'AA1234']);
file_put_contents('trucks.csv', $csvData);
```

### 18.3 Python

#### Installation
```bash
pip install requests
```

#### Example Usage
```python
import requests
import json

class TimsApiClient:
    def __init__(self, base_url='https://api.tims.com/v1', access_token=None):
        self.base_url = base_url
        self.access_token = access_token
        self.session = requests.Session()
        self.session.headers.update({
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        })
        if self.access_token:
            self.session.headers.update({
                'Authorization': f'Bearer {self.access_token}'
            })

    def set_access_token(self, token):
        self.access_token = token
        self.session.headers.update({
            'Authorization': f'Bearer {self.access_token}'
        })

    def get_trucks(self, filters=None):
        try:
            response = self.session.get(f'{self.base_url}/trucks', params=filters)
            response.raise_for_status()
            return response.json()
        except requests.exceptions.RequestException as e:
            raise Exception(f'Error fetching trucks: {e}')

    def create_truck(self, data):
        try:
            response = self.session.post(f'{self.base_url}/trucks', json=data)
            response.raise_for_status()
            return response.json()
        except requests.exceptions.RequestException as e:
            raise Exception(f'Error creating truck: {e}')

    def update_truck(self, truck_id, data):
        try:
            response = self.session.put(f'{self.base_url}/trucks/{truck_id}', json=data)
            response.raise_for_status()
            return response.json()
        except requests.exceptions.RequestException as e:
            raise Exception(f'Error updating truck: {e}')

    def delete_truck(self, truck_id):
        try:
            response = self.session.delete(f'{self.base_url}/trucks/{truck_id}')
            response.raise_for_status()
            return response.json()
        except requests.exceptions.RequestException as e:
            raise Exception(f'Error deleting truck: {e}')

    def export_trucks(self, filters=None):
        try:
            response = self.session.get(f'{self.base_url}/trucks/export', params=filters)
            response.raise_for_status()
            return response.content
        except requests.exceptions.RequestException as e:
            raise Exception(f'Error exporting trucks: {e}')

# Usage example
api = TimsApiClient('https://api.tims.com/v1', 'your-access-token')

# List trucks
trucks = api.get_trucks({'search': 'AA1234', 'sort': 'plate'})

# Create truck
new_truck = api.create_truck({
    'plate': 'AA1234BB',
    'vehicletype_id': 'uuid',
    'chasisNumber': 'CHASIS123456',
    'engineNumber': 'ENGINE123456',
    'tyreSyze': '225/75R16',
    'serviceIntervalKM': 10000,
    'purchasePrice': 1500000,
    'productionDate': '2020-01-01',
    'serviceStartDate': '2020-02-01',
    'status': 'active'
})

# Update truck
updated_truck = api.update_truck('uuid', {
    'serviceIntervalKM': 15000
})

# Delete truck
result = api.delete_truck('uuid')

# Export trucks
csv_data = api.export_trucks({'search': 'AA1234'})
with open('trucks.csv', 'wb') as f:
    f.write(csv_data)
```

---

**Last Updated**: October 21, 2025  
**Version**: 1.0.0  
**Status**: Production Ready  
**Maintainer**: API Team

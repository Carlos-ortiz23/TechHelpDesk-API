# TechHelpDesk API

## Technical Support System - API REST

**Author:** Carlos Alberto Ortiz Correa 
**Clan:** Tayrona 

---

## Description

TechHelpDesk is a REST API developed with NestJS to manage the complete lifecycle of support tickets. The system allows:

- Register users with different roles (Administrator, Technician, Client)
- Creation, assignment and updating of support tickets
- Control of ticket status (Open → In Progress → Resolved → Closed)
- Management of incident categories (Request, Hardware Incident, Software Incident)
- Query of ticket history by client and by technician

## Technologies

- **Framework:** NestJS 10
- **Database:** PostgreSQL
- **ORM:** TypeORM
- **Authentication:** JWT (JSON Web Tokens)
- **Documentation:** Swagger/OpenAPI
- **Validation:** class-validator, class-transformer
- **Testing:** Jest
- **Containers:** Docker, Docker Compose

## Project Structure

```
TechHelpDesk-API/
├── src/
│   ├── common/
│   │   ├── decorators/      # @Roles, @CurrentUser
│   │   ├── enums/           # Role, TicketStatus, TicketPriority
│   │   ├── filters/         # HttpExceptionFilter, AllExceptionsFilter
│   │   ├── guards/          # RolesGuard
│   │   └── interceptors/    # TransformInterceptor
│   ├── database/seeds/      # Database seeders
│   ├── modules/
│   │   ├── auth/            # JWT Authentication
│   │   ├── users/           # User management
│   │   ├── categories/      # Category management
│   │   ├── clients/         # Client management
│   │   ├── technicians/     # Technician management
│   │   └── tickets/         # Ticket management
│   ├── app.module.ts
│   └── main.ts
├── database/init.sql        # SQL dump with initial data
├── Dockerfile
├── docker-compose.yml
├── README.md

```

## Previous Requirements

- Node.js >= 18
- npm >= 9
- PostgreSQL >= 14
- Docker and Docker Compose 

## Installation

### 1. Clone the repository

```bash
git clone https://github.com/tu-usuario/techhelpdesk-api.git
cd techhelpdesk-api
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

Create a `.env` file in the root of the project:

```env
# Database Configuration
DB_HOST=db
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=postgres
DB_DATABASE=techhelpdesk

# JWT Configuration
JWT_SECRET=techhelpdesk-jwt-secret-key-2024
JWT_EXPIRES_IN=24h

# Application Configuration
PORT=3000
NODE_ENV=development

# Docker Configuration (opcional)
API_CONTAINER_NAME=techhelpdesk-api
DB_CONTAINER_NAME=techhelpdesk-db
API_CPU_LIMIT=1
API_MEM_LIMIT=512M
DB_CPU_LIMIT=0.5
DB_MEM_LIMIT=256M
```

### 4. Create the database

```bash
# Connect to PostgreSQL and create the database
psql -U postgres
CREATE DATABASE techhelpdesk;
\q
```

### 5. Run the application

```bash
# Development mode
npm run start:dev

# Production mode
npm run build
npm run start:prod
```

### 6. Run seeders (initial data)

```bash
npm run seed
```

## Docker Deployment

### Using Docker Compose

```bash
# Build and start containers
docker-compose up -d

# Populate the database (initial data)
docker exec techhelpdesk-api npm run seed:prod

# View logs
docker-compose logs -f api

# Stop containers
docker-compose down
```

This will start:
- **PostgreSQL** on port 5432 (configurable with `DB_PORT`)
- **API NestJS** on port 8080 (configurable with `PORT`)

## URL of Swagger

Once the application is running, access the interactive documentation:

**http://localhost:8080/api/docs**

## Endpoints

### Authentication

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| POST | `/api/auth/login` | login | Public |
| POST | `/api/auth/register` | register user (client) | Public |
| GET | `/api/auth/profile` | get current profile | Authenticated |

### Users

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET | `/api/users` | List users | Admin |
| GET | `/api/users/:id` | Get user | Admin |
| POST | `/api/users` | Create user | Admin |
| PATCH | `/api/users/:id` | Update user | Admin |
| DELETE | `/api/users/:id` | Delete user | Admin |

### Categories

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET | `/api/categories` | List categories | Authenticated |
| GET | `/api/categories/:id` | Get category | Authenticated |
| POST | `/api/categories` | Create category | Admin |
| PATCH | `/api/categories/:id` | Update category | Admin |
| DELETE | `/api/categories/:id` | Delete category | Admin |

### Tickets

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET | `/api/tickets` | List tickets | Admin |
| GET | `/api/tickets/:id` | Get ticket by ID | Authenticated* |
| POST | `/api/tickets` | Create ticket | Admin, Client |
| PATCH | `/api/tickets/:id` | Update ticket | Admin |
| PATCH | `/api/tickets/:id/status` | Change status | Admin, Technician |
| PATCH | `/api/tickets/:id/assign` | Assign technician | Admin |
| DELETE | `/api/tickets/:id` | Delete ticket | Admin |
| GET | `/api/tickets/client/:id` | Tickets by client | Admin, Client* |
| GET | `/api/tickets/technician/:id` | Tickets by technician | Admin, Technician* |
| GET | `/api/tickets/my-tickets` | My tickets (client) | Client |
| GET | `/api/tickets/assigned` | Tickets assigned (technician) | Technician |

*With restrictions according to the role

### Clients

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET | `/api/clients` | List clients | Admin, Technician |
| GET | `/api/clients/:id` | Get client | Admin, Technician |
| POST | `/api/clients` | Create client | Admin |
| PATCH | `/api/clients/:id` | Update client | Admin |
| DELETE | `/api/clients/:id` | Delete client | Admin |

### Technicians

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET | `/api/technicians` | List technicians | Admin |
| GET | `/api/technicians/available` | Available technicians | Admin |
| GET | `/api/technicians/:id` | Get technician | Admin, Technician |
| POST | `/api/technicians` | Create technician | Admin |
| PATCH | `/api/technicians/:id` | Update technician | Admin |
| DELETE | `/api/technicians/:id` | Delete technician | Admin |


## Test Credentials

| Role | Email | Password |
|-----|-------|------------|
| Admin | admin@techhelpdesk.com | Password123! |
| Technician | carlos.rodriguez@techhelpdesk.com | Password123! |
| Technician | ana.martinez@techhelpdesk.com | Password123! |
| Client | maria.garcia@empresa.com | Password123! |
| Client | pedro.lopez@empresa.com | Password123! |

## Tests

```bash
# Run unit tests
npm run test

# Run tests with coverage
npm run test:cov

# Run tests in watch mode
npm run test:watch
```

## Business Rules

### Ticket Status Transition
Tickets follow a strict sequence of states:
```
Open (open) → In Progress (in_progress) → Resolved (resolved) → Closed (closed)
```

### Limit of Tickets per Technician
A technician cannot have more than **5 tickets in the "In Progress" state** at the same time.

### Validations
- Tickets cannot be created without a valid category
- Tickets cannot be created without a valid client
- Required fields are validated with class-validator



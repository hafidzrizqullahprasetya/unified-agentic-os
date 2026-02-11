# PHASE 2: Implementation Setup Guide

**Date**: February 10, 2026  
**Project**: Unified-Agentic-OS  
**Phase**: Phase 2 (Implementation - Feb 24 - Mar 31, 2026)  
**Duration**: 6 weeks (42 days)  
**Status**: Setup & initialization

---

## TABLE OF CONTENTS

1. [Phase 2 Overview](#phase-2-overview)
2. [Project Structure](#project-structure)
3. [Development Environment Setup](#development-environment-setup)
4. [Package Dependencies](#package-dependencies)
5. [Configuration Files](#configuration-files)
6. [Database Setup](#database-setup)
7. [First Working Endpoint](#first-working-endpoint)
8. [Development Workflow](#development-workflow)
9. [Testing Strategy](#testing-strategy)
10. [Week-by-Week Plan](#week-by-week-plan)

---

## PHASE 2 OVERVIEW

### Goals
✅ Build working MVP (orders → payments → notifications)  
✅ Integrate 2+ payment gateways (QRIS + bank transfer)  
✅ Connect WhatsApp/Telegram channels  
✅ Set up robust error handling & retries  
✅ Achieve 99%+ payment success rate  
✅ Prepare for beta launch (20 UMKM)

### Timeline: 6 weeks (42 days)

```
Week 1-2: MVP Core (Days 1-14)
  ├─ Day 1-2: Project setup
  ├─ Day 3: Database initialization
  ├─ Day 4-5: Authentication
  ├─ Day 6-8: Core services
  ├─ Day 9-10: API endpoints
  ├─ Day 11-12: Error handling
  └─ Day 13-14: Testing & Docker

Week 3-4: Integrations (Days 15-28)
  ├─ Day 15-17: WhatsApp/Telegram channels
  ├─ Day 18-20: Payment gateways (Xendit + QRIS)
  ├─ Day 21-23: Webhook processing
  ├─ Day 24-25: Inventory management
  └─ Day 26-28: Full testing

Week 5-6: Refinement (Days 29-42)
  ├─ Day 29-32: AI agent (basic context)
  ├─ Day 33-36: Workflow engine
  ├─ Day 37-39: Performance optimization
  ├─ Day 40-41: Beta preparation
  └─ Day 42: Launch readiness
```

### Success Criteria
- [x] Project builds without errors
- [ ] 50+ unit tests passing
- [ ] All core endpoints working
- [ ] Payment flow end-to-end tested
- [ ] Deployment pipeline working
- [ ] Beta customers can place orders
- [ ] Orders can complete full lifecycle

---

## PROJECT STRUCTURE

```
unified-agentic-os/
├── src/
│   ├── api/
│   │   ├── handlers/
│   │   │   ├── auth.ts
│   │   │   ├── customers.ts
│   │   │   ├── orders.ts
│   │   │   ├── payments.ts
│   │   │   ├── products.ts
│   │   │   └── agent.ts
│   │   ├── middleware/
│   │   │   ├── auth.ts
│   │   │   ├── errorHandler.ts
│   │   │   ├── rateLimit.ts
│   │   │   └── logging.ts
│   │   ├── webhooks/
│   │   │   ├── xendit.ts
│   │   │   └── stripe.ts
│   │   └── routes.ts
│   │
│   ├── services/
│   │   ├── auth.service.ts
│   │   ├── customer.service.ts
│   │   ├── order.service.ts
│   │   ├── payment.service.ts
│   │   ├── product.service.ts
│   │   ├── inventory.service.ts
│   │   └── agent.service.ts
│   │
│   ├── db/
│   │   ├── config.ts
│   │   ├── schema.ts
│   │   ├── index.ts
│   │   └── migrations/
│   │       ├── 0001_init.sql
│   │       └── ...
│   │
│   ├── lib/
│   │   ├── errors.ts
│   │   ├── validation.ts
│   │   ├── retry.ts
│   │   ├── jwt.ts
│   │   └── hashing.ts
│   │
│   ├── gateways/
│   │   ├── payment/
│   │   │   ├── stripe.ts
│   │   │   ├── xendit.ts
│   │   │   └── qris.ts
│   │   └── channel/
│   │       ├── whatsapp.ts
│   │       └── telegram.ts
│   │
│   ├── types/
│   │   ├── index.ts
│   │   ├── api.ts
│   │   ├── db.ts
│   │   └── errors.ts
│   │
│   ├── env.ts
│   └── main.ts
│
├── tests/
│   ├── unit/
│   │   ├── services/
│   │   ├── lib/
│   │   └── handlers/
│   ├── integration/
│   │   ├── api/
│   │   └── payments/
│   └── fixtures/
│       └── data.ts
│
├── .github/
│   └── workflows/
│       ├── test.yml
│       ├── lint.yml
│       └── deploy.yml
│
├── docker/
│   ├── Dockerfile
│   └── docker-compose.yml
│
├── docs/
│   ├── api.md (from Phase 1)
│   ├── database.md (from Phase 1)
│   └── DEVELOPMENT.md (new)
│
├── .env.example
├── .env.local (git-ignored)
├── .env.test
├── tsconfig.json
├── package.json
├── pnpm-lock.yaml
├── vitest.config.ts
├── drizzle.config.ts
└── README.md
```

---

## DEVELOPMENT ENVIRONMENT SETUP

### Prerequisites
```bash
# Check versions
node --version  # Should be 22+
npm --version   # 10+
pnpm --version  # 8+

# Or use fnm to manage Node versions
fnm install 22
fnm use 22
```

### Step 1: Initialize Project
```bash
# Create project directory
mkdir -p ~/projects/unified-agentic-os
cd ~/projects/unified-agentic-os

# Initialize git (if not already)
git init
git remote add origin https://github.com/unified-agentic-os/unified-agentic-os

# Create package.json
pnpm init

# Create directory structure
mkdir -p src/{api/{handlers,middleware,webhooks},services,db,lib,gateways/{payment,channel},types}
mkdir -p tests/{unit,integration,fixtures}
mkdir -p .github/workflows docker docs
```

### Step 2: Install Dependencies
```bash
# Core dependencies
pnpm add hono zod drizzle-orm postgres jsonwebtoken bcryptjs dotenv

# Development dependencies
pnpm add -D @types/node @types/jsonwebtoken @types/bcryptjs
pnpm add -D typescript tsx vitest @vitest/ui
pnpm add -D @typescript-eslint/eslint-plugin @typescript-eslint/parser eslint prettier
pnpm add -D drizzle-kit

# Testing
pnpm add -D @testing-library/node supertest

# Optional but recommended
pnpm add -D tsx dotenv-cli
```

### Step 3: TypeScript Configuration
```json
// tsconfig.json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "lib": ["ES2022"],
    "jsx": "react-jsx",
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "noEmit": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"],
      "@/db/*": ["src/db/*"],
      "@/services/*": ["src/services/*"],
      "@/lib/*": ["src/lib/*"],
      "@/types/*": ["src/types/*"]
    }
  },
  "include": ["src"],
  "exclude": ["node_modules", "dist", "tests"]
}
```

---

## PACKAGE DEPENDENCIES

### Core Stack
```json
{
  "dependencies": {
    "hono": "^4.0.0",           // Web framework
    "drizzle-orm": "^0.30.0",   // ORM
    "postgres": "^3.4.0",       // PostgreSQL driver
    "zod": "^3.22.0",           // Schema validation
    "jsonwebtoken": "^9.1.0",   // JWT auth
    "bcryptjs": "^2.4.3",       // Password hashing
    "dotenv": "^16.3.0"         // Environment variables
  },
  "devDependencies": {
    "@types/node": "^20.0.0",
    "@types/jsonwebtoken": "^9.0.0",
    "@types/bcryptjs": "^2.4.2",
    "typescript": "^5.3.0",
    "tsx": "^4.7.0",
    "vitest": "^1.0.0",
    "@vitest/ui": "^1.0.0",
    "@typescript-eslint/parser": "^6.13.0",
    "@typescript-eslint/eslint-plugin": "^6.13.0",
    "eslint": "^8.55.0",
    "prettier": "^3.1.0",
    "drizzle-kit": "^0.20.0",
    "supertest": "^6.3.0"
  }
}
```

---

## CONFIGURATION FILES

### .env.example
```env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/unified_agentic_os

# Server
NODE_ENV=development
PORT=3000
HOST=localhost

# JWT
JWT_SECRET=your-super-secret-key-change-in-production
JWT_EXPIRY=24h
REFRESH_TOKEN_SECRET=refresh-secret-key
REFRESH_TOKEN_EXPIRY=7d

# Payment Gateways
XENDIT_API_KEY=xnd_live_your_key
STRIPE_SECRET_KEY=sk_live_your_key
QRIS_GATEWAY_URL=https://api.qris-gateway.id

# Logging
LOG_LEVEL=info

# CORS
CORS_ORIGIN=http://localhost:3000,http://localhost:3001

# Email (for future use)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
```

### vitest.config.ts
```typescript
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'dist/',
        'tests/',
      ],
      lines: 70,
      functions: 70,
      branches: 70,
      statements: 70,
    },
    testMatch: ['tests/**/*.test.ts'],
    exclude: ['node_modules', 'dist'],
  },
});
```

### drizzle.config.ts
```typescript
import type { Config } from 'drizzle-kit';

export default {
  schema: './src/db/schema.ts',
  out: './src/db/migrations',
  driver: 'pg',
  dbCredentials: {
    connectionString: process.env.DATABASE_URL!,
  },
} satisfies Config;
```

### package.json scripts
```json
{
  "scripts": {
    "dev": "tsx watch src/main.ts",
    "build": "tsc",
    "start": "node dist/main.js",
    "test": "vitest",
    "test:ui": "vitest --ui",
    "test:coverage": "vitest --coverage",
    "lint": "eslint src tests",
    "lint:fix": "eslint src tests --fix",
    "format": "prettier --write src tests docs",
    "type-check": "tsc --noEmit",
    "db:generate": "drizzle-kit generate:pg",
    "db:migrate": "drizzle-kit migrate",
    "db:push": "drizzle-kit push:pg",
    "db:studio": "drizzle-kit studio"
  }
}
```

---

## DATABASE SETUP

### Step 1: PostgreSQL Installation

```bash
# macOS (using Homebrew)
brew install postgresql@15
brew services start postgresql@15

# Or use Docker
docker run --name postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=unified_agentic_os \
  -p 5432:5432 \
  -d postgres:15-alpine

# Linux
sudo apt-get install postgresql-15
sudo systemctl start postgresql
```

### Step 2: Create Database
```bash
# Create database and user
createdb unified_agentic_os
psql unified_agentic_os

# Or with password
createuser -P unified_user
createdb -O unified_user unified_agentic_os
```

### Step 3: Environment Setup
```bash
# Create .env.local (git-ignored)
cp .env.example .env.local

# Edit .env.local with your database URL
DATABASE_URL=postgresql://unified_user:password@localhost:5432/unified_agentic_os
```

### Step 4: Generate & Run Migrations
```bash
# Generate migrations from schema
pnpm db:generate

# Apply migrations to database
pnpm db:migrate

# Or in development (push schema directly)
pnpm db:push

# Seed database with test data
pnpm tsx src/db/seed.ts
```

---

## FIRST WORKING ENDPOINT

### Step 1: Create Environment Module

```typescript
// src/env.ts
import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'staging', 'production']).default('development'),
  PORT: z.coerce.number().default(3000),
  HOST: z.string().default('localhost'),
  DATABASE_URL: z.string(),
  JWT_SECRET: z.string(),
  JWT_EXPIRY: z.string().default('24h'),
});

export const env = envSchema.parse(process.env);
```

### Step 2: Create Database Config

```typescript
// src/db/config.ts
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';
import { env } from '@/env';

const client = postgres(env.DATABASE_URL, {
  max: 10,
  prepare: true,
});

export const db = drizzle(client, { schema });
export type Database = typeof db;
```

### Step 3: Create Error Handler

```typescript
// src/lib/errors.ts
export class AppError extends Error {
  constructor(
    public code: string,
    public status: number,
    message: string,
    public context?: Record<string, any>
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export class ValidationError extends AppError {
  constructor(message: string, context?: Record<string, any>) {
    super('VALIDATION_ERROR', 400, message, context);
    this.name = 'ValidationError';
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string, id?: string) {
    super('NOT_FOUND', 404, `${resource} not found${id ? `: ${id}` : ''}`);
    this.name = 'NotFoundError';
  }
}

export class AuthError extends AppError {
  constructor(message: string = 'Unauthorized') {
    super('UNAUTHORIZED', 401, message);
    this.name = 'AuthError';
  }
}

export class PaymentError extends AppError {
  constructor(message: string, context?: Record<string, any>) {
    super('PAYMENT_FAILED', 402, message, context);
    this.name = 'PaymentError';
  }
}
```

### Step 4: Create Health Check Endpoint

```typescript
// src/main.ts
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { env } from '@/env';

const app = new Hono();

// Middleware
app.use(logger());
app.use(
  cors({
    origin: env.CORS_ORIGIN?.split(',') || '*',
    credentials: true,
  })
);

// Health check endpoint
app.get('/health', (c) => {
  return c.json({
    success: true,
    data: {
      status: 'ok',
      timestamp: new Date().toISOString(),
      environment: env.NODE_ENV,
    },
  });
});

// Start server
const port = env.PORT;
console.log(`Starting server on http://${env.HOST}:${port}`);

export default app;
```

### Step 5: Create Test
```typescript
// tests/unit/health.test.ts
import { describe, it, expect } from 'vitest';
import app from '@/main';

describe('Health Check', () => {
  it('should return 200 with ok status', async () => {
    const res = await app.request(new Request('http://localhost/health'));
    expect(res.status).toBe(200);
    const body = await res.json() as any;
    expect(body.success).toBe(true);
    expect(body.data.status).toBe('ok');
  });
});
```

### Step 6: Run
```bash
# Development
pnpm dev

# In another terminal, test
curl http://localhost:3000/health

# Run tests
pnpm test
```

---

## DEVELOPMENT WORKFLOW

### Daily Workflow
```bash
# 1. Start development server
pnpm dev

# 2. In another terminal, run tests in watch mode
pnpm test --watch

# 3. When ready to commit
pnpm lint:fix
pnpm format
pnpm type-check
pnpm test

# 4. Git workflow
git add .
git commit -m "feat: add customer endpoints"
git push
```

### Code Style

```typescript
// Naming conventions
interface UserData { /* ... */ }
class UserService { /* ... */ }
const getUserById = async (id: string) => { /* ... */ };
type UserRecord = typeof users.$inferSelect;

// Error handling
try {
  const user = await getUserById(id);
  if (!user) throw new NotFoundError('User', id);
  return user;
} catch (err) {
  if (err instanceof AppError) throw err;
  throw new Error(`Unexpected error: ${err}`);
}

// Async/await (not promises)
const result = await db.select().from(users);

// Type guards
if (err instanceof ValidationError) {
  // handle validation
}
```

---

## TESTING STRATEGY

### Test Coverage Targets
- Unit tests: 70% (services, lib)
- Integration tests: 50% (API endpoints)
- E2E tests: 30% (critical flows)

### Test Structure
```
tests/
├── unit/
│   ├── services/
│   │   ├── customer.service.test.ts
│   │   ├── order.service.test.ts
│   │   └── payment.service.test.ts
│   └── lib/
│       ├── validation.test.ts
│       ├── jwt.test.ts
│       └── retry.test.ts
├── integration/
│   ├── api/
│   │   ├── auth.test.ts
│   │   ├── customers.test.ts
│   │   ├── orders.test.ts
│   │   └── payments.test.ts
│   └── payments/
│       ├── xendit.test.ts
│       └── webhook.test.ts
└── fixtures/
    └── data.ts
```

### Test Example
```typescript
// tests/unit/services/customer.service.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { CustomerService } from '@/services/customer.service';
import { createMockDeps } from '@/tests/fixtures/data';

describe('CustomerService', () => {
  let service: CustomerService;

  beforeEach(() => {
    const deps = createMockDeps();
    service = new CustomerService(deps.db);
  });

  it('should create a customer', async () => {
    const customer = await service.create({
      storeId: 'store_123',
      name: 'Ahmad',
      phone: '081234567890',
    });

    expect(customer.id).toBeDefined();
    expect(customer.name).toBe('Ahmad');
  });

  it('should get customer by id', async () => {
    const created = await service.create({
      storeId: 'store_123',
      name: 'Ahmad',
      phone: '081234567890',
    });

    const found = await service.getById(created.id);
    expect(found?.id).toBe(created.id);
  });
});
```

---

## WEEK-BY-WEEK PLAN

### Week 1-2: MVP Core (Days 1-14)

**Day 1-2: Project Setup** ✅ (Today)
- [x] Initialize Hono + TypeScript project
- [x] Set up PostgreSQL + Drizzle ORM
- [x] Create environment configuration
- [x] Set up error handling
- [x] Create health check endpoint
- [x] Set up testing framework
- [ ] Create first working endpoint

**Day 3: Database Initialization**
- [ ] Generate migrations from schema.ts
- [ ] Apply migrations to database
- [ ] Seed test data
- [ ] Verify schema in database

**Day 4-5: Authentication System**
- [ ] Implement JWT utilities (sign, verify, refresh)
- [ ] Create password hashing (bcryptjs)
- [ ] Implement auth middleware
- [ ] Create /auth/register endpoint
- [ ] Create /auth/login endpoint
- [ ] Create /auth/refresh endpoint

**Day 6-8: Core Services**
- [ ] Implement CustomerService
- [ ] Implement OrderService
- [ ] Implement ProductService
- [ ] Implement PaymentService
- [ ] Add unit tests for services

**Day 9-10: API Endpoints**
- [ ] Create customer endpoints (CRUD)
- [ ] Create product endpoints (list, get)
- [ ] Create order endpoints (create, list, get)
- [ ] Add request validation (zod)

**Day 11-12: Error Handling & Validation**
- [ ] Implement error middleware
- [ ] Add validation for all endpoints
- [ ] Implement error response formatting
- [ ] Add logging middleware

**Day 13-14: Testing & Docker**
- [ ] Write integration tests
- [ ] Create Dockerfile
- [ ] Create docker-compose.yml
- [ ] Set up GitHub Actions CI

### Week 3-4: Integrations (Days 15-28)
- WhatsApp/Telegram adapters
- Payment gateway integrations
- Webhook handling
- Full end-to-end testing

### Week 5-6: Refinement (Days 29-42)
- AI agent (basic)
- Workflow engine
- Performance optimization
- Beta preparation

---

## QUICK START COMMANDS

```bash
# Clone and setup
git clone https://github.com/unified-agentic-os/unified-agentic-os
cd unified-agentic-os
pnpm install

# Environment
cp .env.example .env.local
# Edit .env.local with your database URL

# Database
pnpm db:push
pnpm tsx src/db/seed.ts

# Development
pnpm dev          # Terminal 1: Server
pnpm test --watch # Terminal 2: Tests

# Production
pnpm build
pnpm start
```

---

## NEXT STEPS

### Immediately (Day 1-2)
1. Create all configuration files (tsconfig.json, vitest.config.ts, etc)
2. Install dependencies
3. Set up PostgreSQL database
4. Create health check endpoint
5. Verify project runs: `pnpm dev`

### Then (Day 3)
- Generate migrations: `pnpm db:generate`
- Apply migrations: `pnpm db:migrate`
- Create first real service

### Success Criteria Day 2
✅ `pnpm dev` runs without errors  
✅ `curl http://localhost:3000/health` returns 200  
✅ `pnpm test` passes health check test  
✅ `pnpm db:migrate` runs successfully

---

**Document Status**: Setup guide for Phase 2  
**Next**: DATABASE INITIALIZATION (Day 3)  
**Author**: AI Implementation Agent  
**Date**: February 10, 2026

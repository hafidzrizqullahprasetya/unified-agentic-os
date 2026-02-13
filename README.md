# Unified Agentic OS

**Platform Unified Commerce Powered by AI untuk UMKM Indonesia**

Sistem operasi terpadu yang menyatukan Retail (Jual Barang), Service (Jasa/Booking), dan SaaS (Langganan) dalam satu platform yang digerakkan oleh AI agent cerdas.

---

## 🚀 Quick Links

- **[📚 Full Documentation](./docs/README.md)** - Architecture, guides, and API docs
- **[🎯 Development Progress](./docs/PROGRESS.md)** - Current status and timeline
- **[🏗️ Architecture Guide](./docs/guides/ARCHITECTURE.md)** - System design
- **[🔧 Setup Guide](./docs/guides/SETUP.md)** - Getting started locally

---

## 📋 Project Status

| Phase       | Duration | Status         | Progress          |
| ----------- | -------- | -------------- | ----------------- |
| **Phase 1** | 2 weeks  | ✅ Complete    | 100%              |
| **Phase 2** | 6 weeks  | 🚀 In Progress | 40% (Days 1-5/14) |
| **Phase 3** | TBD      | 📅 Pending     | 0%                |

**Target Launch**: March 31, 2026 (Beta)

---

## 💻 Tech Stack

- **Runtime**: Node.js 22+ (ES2022)
- **Framework**: Hono (lightweight HTTP)
- **Language**: TypeScript (strict mode)
- **Database**: PostgreSQL + Drizzle ORM
- **Auth**: JWT + bcryptjs
- **Validation**: Zod
- **Payment**: Midtrans (QRIS, Bank Transfer, CC, E-Wallet)
- **Messaging**: WhatsApp Business API (primary), Telegram Bot (optional)

---

## 🎯 Key Features

### ✅ Implemented

- **Authentication**: JWT + bcryptjs password hashing
- **Core Services**: Customer, Product, Order, Store management
- **API Endpoints**: 24 RESTful endpoints with proper error handling
- **Database**: 16 optimized tables with 40+ indexes
- **Payment Integration**: Midtrans Snap API (QRIS, Bank Transfer, CC, E-Wallet)
- **Error Handling**: 30+ standardized error codes
- **TypeScript**: 100% strict mode, zero `any` types

### ⏳ Coming Soon

- **Inventory Management**: Stock reservation, movement tracking
- **WhatsApp Integration**: Native messaging support (priority)
- **Telegram Bot**: Optional messaging channel
- **AI Agent**: Context-aware customer service
- **Workflow Automation**: Smart order processing
- **Testing & Docker**: Full containerization support

---

## 📁 Project Structure

```
unified-agentic-os/
├── docs/                          # All documentation
│   ├── README.md                 # Documentation index
│   ├── PROGRESS.md               # Development progress & timeline
│   ├── guides/                   # Implementation guides
│   ├── api/                      # API documentation
│   ├── phase1/                   # Phase 1 research docs
│   └── phase2/                   # Phase 2 implementation docs
├── src/
│   ├── api/                      # HTTP handlers & middleware
│   ├── db/                       # Database config & schema
│   ├── lib/                      # Utilities (errors, auth, validation)
│   ├── services/                 # Business logic layer
│   ├── main.ts                   # Hono server entry point
│   └── env.ts                    # Environment validation
├── scripts/                      # Seed & test scripts
├── types/                        # TypeScript type definitions
├── dist/                         # Compiled output
├── package.json                  # Dependencies
├── tsconfig.json                 # TypeScript config
└── README.md                     # This file
```

---

## 🚀 Getting Started

### Prerequisites

```bash
node --version    # Should be 22+
npm --version     # Should be 10+
```

### Installation

```bash
# Clone repository
git clone https://github.com/hafidzrizqullahprasetya/unified-agentic-os.git
cd unified-agentic-os

# Install dependencies
npm install

# Setup environment
cp .env.example .env
# Edit .env with your Supabase and Midtrans credentials

# Build
npm run build

# Development
npm run dev
```

---

## 📦 Environment Variables

### Required (Production)

```bash
# Database (Supabase connection pooler recommended)
DATABASE_URL=postgresql://user:password@host:6543/postgres

# JWT
JWT_SECRET=your-32-character-minimum-secret-key
JWT_EXPIRY=24h

# Payment Gateway (Midtrans)
MIDTRANS_SERVER_KEY=your-server-key
MIDTRANS_CLIENT_KEY=your-client-key
MIDTRANS_MERCHANT_ID=your-merchant-id
MIDTRANS_ENV=sandbox|production

# Admin Account
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=secure-password
```

### Optional

```bash
# Messaging (for future integration)
WHATSAPP_BUSINESS_TOKEN=... # WhatsApp Business API token
TELEGRAM_BOT_TOKEN=...      # Telegram bot token
```

---

## 📊 Current Deliverables

### ✅ Phase 2 Days 1-5 Complete

**Core Implementation**:

- RESTful API with 24 endpoints
- JWT authentication with role-based access
- Database with 16 optimized tables
- 4 core services (Customer, Product, Order, Store)
- Error handling with 30+ codes
- TypeScript: 100% strict, 0 compilation errors

**Payment Integration** (Days 4-5):

- Midtrans Snap API client
- Support for QRIS, Bank Transfer, Credit Card, E-Wallet
- Webhook signature verification
- Cash payment fallback
- Payment test script

**Code Quality**:

- Zero TypeScript errors
- Clean build output
- Well-documented code
- Proper error handling

### 📝 Test Script

```bash
# Test payment integration
npx tsx scripts/test-payments.ts
```

---

## 🔗 Next Steps

### Phase 2 - Remaining Days (6-14)

**Days 6-7**: Inventory Management

- Stock reservation system
- Movement tracking
- Low stock alerts
- Inventory adjustment workflows

**Days 8-9**: Testing & Docker

- Unit & integration tests
- Docker containerization
- CI/CD pipeline setup
- Performance optimization

**Days 10-11**: Error Handling & Rate Limiting

- Enhanced error codes
- Request rate limiting
- Webhook retry logic
- Better validation

**Days 12-14**: WhatsApp Integration & Deployment

- **WhatsApp Business API integration** (priority)
- Telegram bot adapter (optional)
- Message parsing and routing
- Deployment preparation
- Beta launch readiness

---

## 📚 Documentation

All documentation is organized in the `/docs` directory:

- **[Full Index](./docs/README.md)** - Complete documentation index
- **[Architecture Guide](./docs/guides/ARCHITECTURE.md)** - System design & patterns
- **[API Documentation](./docs/api/API-ENDPOINTS.md)** - All 24 endpoints
- **[Database Schema](./docs/api/DATABASE-SCHEMA.md)** - Table structure & relationships
- **[Development Progress](./docs/PROGRESS.md)** - Timeline & status

---

## 🛠️ Development Commands

```bash
# Build & compile
npm run build

# Development server (with hot reload)
npm run dev

# Run tests
npm test

# Run specific test
npm test -- src/health.test.ts

# Type check only
tsc --noEmit

# Database commands
npm run db:generate   # Generate migrations
npm run db:push       # Apply migrations
npm run db:studio     # Open visual DB editor
```

---

## 📊 Code Quality Standards

- **Language**: TypeScript with `strict: true`
- **Types**: Zero `any` types across codebase
- **Validation**: Zod schemas for all inputs
- **Error Handling**: Standardized error codes & messages
- **Testing**: Vitest with 70% coverage target
- **Build**: Zero compilation errors
- **Documentation**: Well-commented code with JSDoc

---

## 🎯 Key Milestones

```
✅ Week 1 (Days 1-7)
  ✅ Project setup & core services
  ✅ Database schema & migrations
  ✅ API endpoints (24 endpoints)
  ✅ Payment integration (Midtrans)

🚀 Week 2-3 (Days 8-21)
  ⏳ Inventory management
  ⏳ Testing & Docker
  ⏳ WhatsApp integration (priority)
  ⏳ Telegram integration (optional)

📅 Week 4-6 (Days 22-42)
  ⏳ AI agent & workflow automation
  ⏳ Performance & optimization
  ⏳ Beta testing
  ⏳ Launch preparation
```

---

## 📞 Contact & Support

- **GitHub**: https://github.com/hafidzrizqullahprasetya/unified-agentic-os
- **Status**: Beta development in progress
- **Last Updated**: February 13, 2026

---

## 📜 License

MIT License - See LICENSE file for details

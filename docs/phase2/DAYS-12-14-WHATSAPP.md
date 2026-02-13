# Days 12-14: WhatsApp Business API Integration

**Objective**: Integrate WhatsApp Business API as primary messaging channel

**Duration**: 3 days  
**Status**: 📅 Pending  
**Priority**: 🔴 HIGH (WhatsApp priority, Telegram optional)

---

## 📱 Overview

WhatsApp is where UMKM Indonesia already conducts business. We'll build:

1. **Message Receiving** - Receive customer messages via Webhook
2. **Message Sending** - Send order confirmations, status updates
3. **Order Creation** - Process orders directly from WhatsApp
4. **Customer Support** - AI-assisted responses
5. **Status Notifications** - Real-time order updates

**Vision**: Customers can place orders, pay, and track in WhatsApp without leaving the app.

---

## 🏗️ Architecture

### WhatsApp Flow

```
Customer                           Platform
   │                                  │
   ├─ Sends message "order 2 barang"─│
   │                                  │
   │◄─ Receives: "Ketik menu untuk..."─┤
   │                                  │
   ├─ Sends: "menu"                  │
   │                                  │
   │◄─ Receives: Product list (image+text)
   │                                  │
   ├─ Sends: "order product-1 qty 2"─│
   │                                  │
   │◄─ Receives: "Konfirmasi: 2x ... Rp500k"
   │                                  │
   ├─ Sends: confirmation/payment info│
   │                                  │
   │◄─ Receives: "Pesanan confirmed,link bayar..."
   │                                  │
   ├─ Makes payment (Midtrans link)  │
   │                                  │
   │◄─ Receives: "Pembayaran confirmed!"
   │                                  │
   │◄─ Receives: Real-time status updates
```

---

## 📡 Integration Components

### 1. WhatsApp Service

```typescript
WhatsAppService
├── sendMessage(phoneNumber, text/image)      # Send to customer
├── parseMessage(incomingMessage)             # NLP parsing
├── handleWebhook(payload)                    # Receive from Meta
├── verifyWebhookSignature(payload)           # Webhook security
├── formatOrderMessage(order)                 # Rich message formatting
└── notifyStatusChange(orderId, status)       # Order updates
```

### 2. Message Parser

```typescript
MessageParser
├── isMenuRequest()              # "menu", "catalog", "produk"
├── isOrderRequest()             # "order product-1 qty 2"
├── isPaymentRequest()           # "bayar", "payment"
├── isStatusRequest()            # "status", "track"
├── isCustomerSupport()          # Other queries
└── extractOrderDetails()        # Parse order from message
```

### 3. Webhook Handler

```
POST /api/webhooks/whatsapp
├── Verify signature (Meta security)
├── Parse incoming message
├── Route to handler
├── Save to audit log
└── Return 200 OK quickly
```

---

## 🔧 Implementation Plan

### Day 12: Setup & Message Receiving

#### Part 1: Environment Setup

```bash
# Get WhatsApp Business Account ID & Phone ID
# From: https://developers.facebook.com/docs/whatsapp/cloud-api/get-started

# .env additions:
WHATSAPP_BUSINESS_PHONE_ID=your-phone-id
WHATSAPP_BUSINESS_ACCOUNT_ID=your-account-id
WHATSAPP_API_TOKEN=your-verify-token
WHATSAPP_WEBHOOK_VERIFY_TOKEN=random-token
```

#### Part 2: Webhook Endpoint

```typescript
// src/api/handlers/webhooks.ts
POST /api/webhooks/whatsapp

// Steps:
1. Verify webhook token (Meta requirement)
2. Parse incoming message
3. Extract customer phone & text
4. Save to customer_messages table
5. Route to appropriate handler
6. Return 200 OK immediately
```

#### Part 3: WhatsAppService

```typescript
// src/services/whatsapp.service.ts

class WhatsAppService {
  async sendMessage(phoneNumber, message) {
    // Call Meta API
    // POST https://graph.instagram.com/v18.0/{PHONE_ID}/messages
    // Send text/image/template
  }

  async verifyWebhookSignature(req) {
    // Verify X-Hub-Signature header
    // Prevent replay attacks
  }

  parseIncomingMessage(payload) {
    // Extract:
    // - Phone number (from)
    // - Message text
    // - Message ID
    // - Timestamp
  }
}
```

**Deliverable**: Webhook receiving working, messages saved to DB

---

### Day 13: Message Parsing & Order Processing

#### Part 1: Message Parser

```typescript
// src/lib/whatsapp-parser.ts

class WhatsAppParser {
  // Menu requests: "menu", "catalog", "produk apa aja"
  isMenuRequest(text) {
    const keywords = ["menu", "catalog", "produk", "list"];
    return keywords.some((k) => text.toLowerCase().includes(k));
  }

  // Order requests: "order product-1 qty 2", "2x barang-1"
  isOrderRequest(text) {
    const pattern = /order|qty|jumlah|beli/i;
    return pattern.test(text);
  }

  // Extract order details
  extractOrderDetails(text) {
    // Parse: "order product-1 qty 2"
    // Return: { productId: 1, quantity: 2 }
  }

  // Payment requests: "bayar", "transfer", "payment"
  isPaymentRequest(text) {
    const keywords = ["bayar", "transfer", "payment", "price"];
    return keywords.some((k) => text.toLowerCase().includes(k));
  }

  // Status tracking: "status", "sudah dikirim?"
  isStatusRequest(text) {
    const keywords = ["status", "dimana", "sudah", "track"];
    return keywords.some((k) => text.toLowerCase().includes(k));
  }
}
```

#### Part 2: Message Handlers

```typescript
// src/services/whatsapp.service.ts - continued

async handleMenuRequest(phoneNumber) {
  // Get store products
  // Format as Rich Message (image + text)
  // Example:
  // 🏪 *Toko Menu*
  // 1️⃣ Shampo (Rp15k)
  // 2️⃣ Kondisioner (Rp12k)
  // Kirim "order [nomor] qty [jumlah]"

  const products = await getStoreProducts();
  const message = formatProductMenu(products);
  await sendMessage(phoneNumber, message);
}

async handleOrderRequest(phoneNumber, orderDetails) {
  // 1. Validate customer/store exists
  // 2. Check stock availability
  // 3. Create order draft
  // 4. Generate payment link (Midtrans)
  // 5. Send to customer with payment link

  const order = await createOrder({
    phoneNumber,
    items: orderDetails.items,
    channel: "whatsapp"
  });

  const message = `
*Pesanan Konfirmasi* ✅
Nomor: ${order.orderNumber}
Total: Rp${order.total}

Bayar di sini: ${order.paymentLink}
(Valid 1 jam)
  `;

  await sendMessage(phoneNumber, message);
}

async handleStatusRequest(phoneNumber, orderNumber) {
  // Get order status
  // Send formatted message
  // Example: "Pesanan #123 sedang diproses..."

  const order = await getOrder(orderNumber);
  const message = formatOrderStatus(order);
  await sendMessage(phoneNumber, message);
}

async handlePaymentConfirmation(phoneNumber, orderId) {
  // Called when payment webhook received
  // Update order status
  // Notify customer

  const message = `
*Pembayaran Berhasil* ✅
Pesanan ${orderId} sudah dikonfirmasi!
Barang akan dikirim dalam 1-2 jam.

Track: ${trackingUrl}
  `;

  await sendMessage(phoneNumber, message);
}
```

#### Part 3: Message Routing

```typescript
// In webhook handler

async function handleIncomingWhatsAppMessage(message) {
  const parser = new WhatsAppParser();

  if (parser.isMenuRequest(message.text)) {
    await whatsAppService.handleMenuRequest(message.from);
  } else if (parser.isOrderRequest(message.text)) {
    const details = parser.extractOrderDetails(message.text);
    await whatsAppService.handleOrderRequest(message.from, details);
  } else if (parser.isStatusRequest(message.text)) {
    const orderNumber = parser.extractOrderNumber(message.text);
    await whatsAppService.handleStatusRequest(message.from, orderNumber);
  } else {
    // Customer support / AI response
    await handleCustomerSupport(message);
  }
}
```

**Deliverable**: Message parsing working, orders created from WhatsApp

---

### Day 14: Notifications & Polish

#### Part 1: Outbound Notifications

```typescript
// Triggered by order events

OrderService.createOrder()
  └─ Emit: "order.created"
     └─ WhatsAppService.notifyOrderCreated()

PaymentService.updatePaymentStatus()
  └─ Emit: "payment.confirmed"
     └─ WhatsAppService.notifyPaymentConfirmed()

OrderService.updateOrderStatus()
  └─ Emit: "order.shipped"/"order.delivered"
     └─ WhatsAppService.notifyStatusChange()
```

#### Part 2: Message Templates

Use WhatsApp message templates for:

- Order confirmation
- Payment reminder
- Shipping notification
- Delivery confirmation

```typescript
const templates = {
  ORDER_CONFIRMATION: `
*Pesanan Diterima* ✅
Nomor: {ORDER_NUMBER}
Total: Rp{TOTAL}
Status: {STATUS}

Bayar di: {PAYMENT_LINK}
  `,

  PAYMENT_CONFIRMED: `
*Pembayaran Berhasil* ✅
Pesanan {ORDER_NUMBER} dikonfirmasi!
Barang akan dikirim hari ini.
  `,

  ORDER_SHIPPED: `
*Pesanan Dikirim* 📦
Nomor: {ORDER_NUMBER}
Kurir: {COURIER}
Tracking: {TRACKING_URL}
  `,
};
```

#### Part 3: Error Handling

```typescript
// Handle common errors

async sendMessage(phoneNumber, text) {
  try {
    const response = await metaApi.send({
      to: phoneNumber,
      text: text
    });

    // Log success
    await saveMessageLog(phoneNumber, text, "sent");
    return response;
  } catch (error) {
    if (error.code === "INVALID_PHONE") {
      throw new ValidationError("Invalid phone number");
    }
    if (error.code === "RATE_LIMITED") {
      // Queue for retry
      await queueMessage(phoneNumber, text);
    }
    throw error;
  }
}
```

#### Part 4: Testing

```bash
npx tsx scripts/test-whatsapp.ts

# Tests:
1. Webhook verification
2. Message parsing (menu, order, status)
3. Order creation from WhatsApp
4. Payment link generation
5. Status notifications
6. Message sending
```

**Deliverable**: Full WhatsApp flow working end-to-end

---

## 📊 Telegram (Optional - Days 12-14)

If time permits, implement as alternative channel:

```typescript
// src/services/telegram.service.ts

class TelegramService {
  async sendMessage(chatId, text);
  async handleWebhook(update);
  async parseCommand(text);
  async handleMenuRequest(chatId);
  // Similar to WhatsApp but simpler
}

// Routes: /api/webhooks/telegram
// Similar message flow
```

### Telegram Advantages

- No phone number needed (user IDs instead)
- Better for tech-savvy users
- Less common in Indonesia but growing

### Decision

- **Primary**: WhatsApp (where UMKM operate)
- **Optional**: Telegram (if time permits)
- **Don't build**: Facebook Messenger (low adoption in Indonesia)

---

## 🗂️ File Structure

```
src/
├── services/
│   ├── whatsapp.service.ts                # NEW
│   │   ├── sendMessage()
│   │   ├── handleMenuRequest()
│   │   ├── handleOrderRequest()
│   │   └── notifyStatusChange()
│   └── telegram.service.ts                # OPTIONAL
├── api/handlers/
│   ├── webhooks.ts                        # NEW/UPDATED
│   │   ├── POST /webhooks/whatsapp
│   │   └── POST /webhooks/telegram (optional)
├── lib/
│   ├── whatsapp-parser.ts                 # NEW
│   └── telegram-parser.ts                 # OPTIONAL
└── main.ts                                # Update routes
```

---

## 🔐 Security Checklist

- ✅ Verify webhook signatures (Meta requirement)
- ✅ Rate limiting (prevent spam)
- ✅ Phone number validation
- ✅ Message content sanitization
- ✅ Audit logging (all messages logged)
- ✅ Only reply to valid customers
- ✅ HTTPS only (Meta requirement)

---

## 📈 Success Criteria

✅ **Day 12 End**:

- Webhook receiving working
- Messages saved to database
- Signature verification passing

✅ **Day 13 End**:

- Message parser working
- Order creation from WhatsApp
- Payment links sent

✅ **Day 14 End**:

- Full message flow tested
- Notifications working
- Error handling complete
- 0 TypeScript errors

---

## 🚀 Beta Launch Readiness

After WhatsApp integration:

- [ ] Test with 5-10 real customers
- [ ] Monitor message logs
- [ ] Collect feedback
- [ ] Fix bugs
- [ ] Final documentation
- [ ] Launch announcements

---

## 📱 Customer Journey (After Launch)

```
Customer: "Halo, ada barang apa?"
Bot: Sends menu with 5 products

Customer: "order shampo qty 2"
Bot: Sends order confirmation with payment link

Customer: Makes payment
Bot: Confirms payment, sends tracking info

Customer: "Status pesanan?"
Bot: Shows current status with eta

[Repeat as needed]

Day 3: Order delivered
Bot: Sends delivery confirmation
Bot: Asks for feedback/rating
```

---

## 💡 Future Enhancements (Phase 3)

- [ ] AI-powered customer support responses
- [ ] Broadcast announcements
- [ ] Customer loyalty programs
- [ ] Promotional campaigns
- [ ] Multi-language support
- [ ] Media support (photos, documents)
- [ ] Group chat support
- [ ] Chatbot learning (from interactions)

---

**Ready to build?** 🚀

This is where the magic happens - customers can run their entire business from WhatsApp!

After Days 12-14, you'll have a fully functional unified commerce platform with chat-native experience.

---

**Total Phase 2 Timeline**:

- Days 1-5: ✅ Core API + Payments
- Days 6-7: ⏳ Inventory
- Days 8-9: ⏳ Testing & Docker
- Days 10-11: ⏳ Error Handling & Rate Limiting
- Days 12-14: ⏳ WhatsApp Integration (PRIORITY) + Telegram (OPTIONAL)

**Next**: Implementation begins after cleanup! 🎯

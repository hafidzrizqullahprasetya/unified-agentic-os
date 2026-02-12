# Day 3 Setup: Supabase Database Migration

**Status**: Clean project, ready for Supabase setup  
**Date**: Feb 12, 2026  
**Task**: Create database schema in Supabase

---

## 📋 CHECKLIST - What You Need to Do

### ✅ Step 1: Prepare Migration SQL

Migration SQL already generated in code. Location:

- File: `src/db/migrations/0000_thankful_old_lace.sql`
- Status: ✅ Generated and ready

### ⏳ Step 2: Open Supabase Studio (WHAT YOU DO)

1. **Login to Supabase**: https://app.supabase.com
2. **Select Project**: `dbluwnepmjnhiklidbza`
3. **Click SQL Editor** in left sidebar
4. **Click New Query** or paste in empty area

### ⏳ Step 3: Copy Migration SQL (WHAT YOU DO)

**Via Terminal** (fastest):

```bash
cat src/db/migrations/0000_thankful_old_lace.sql | pbcopy
```

Then in Supabase SQL Editor, paste (Cmd+V)

**OR Via File Editor**:

1. Open file: `src/db/migrations/0000_thankful_old_lace.sql`
2. Select all (Cmd+A)
3. Copy (Cmd+C)
4. Paste in Supabase SQL Editor (Cmd+V)

### ⏳ Step 4: Run Migration (WHAT YOU DO)

In Supabase SQL Editor:

1. Click **Run** button (or Cmd+Enter)
2. Wait for completion (should be ~5-10 seconds)
3. Check for any errors in output

---

## 🎯 What Gets Created

Running the migration creates:

**5 Enum Types**:

- `channel` (whatsapp, telegram, web, mobile, api)
- `order_status` (pending, confirmed, processing, shipped, delivered, cancelled, refunded)
- `payment_method` (qris, bank_transfer, credit_card, e_wallet, cash)
- `payment_status` (pending, processing, paid, failed, cancelled, refunded)
- `user_role` (admin, seller, customer)

**15 Tables**:

- Core: users, stores, products, product_variants, customers
- Orders: orders, order_items, order_status_history
- Payments: payments, payment_methods, payment_webhook_logs
- Inventory: inventory_reservations, inventory_movements
- Audit: customer_messages, event_audit_log

**40+ Indexes** for performance

---

## ✅ Step 5: Verify Tables Created (WHAT YOU DO)

After running SQL:

1. Go to **Table Editor** in Supabase sidebar
2. You should see all 15 tables listed
3. Click on a few to verify structure (e.g., `users`, `stores`)

---

## ✅ Step 6: Verify in Code

After tables created, run:

```bash
npm run build
```

Should compile with 0 errors ✅

---

## 🚀 SUMMARY

| Step | What                   | Who           | Status  |
| ---- | ---------------------- | ------------- | ------- |
| 1    | Generate migration SQL | Code (done)   | ✅      |
| 2    | Open Supabase Studio   | YOU           | ⏳ TODO |
| 3    | Copy migration SQL     | YOU           | ⏳ TODO |
| 4    | Run in SQL Editor      | YOU           | ⏳ TODO |
| 5    | Verify tables exist    | YOU           | ⏳ TODO |
| 6    | Verify code builds     | Code (manual) | ⏳ TODO |

---

## ⚠️ Troubleshooting

**Q: Port 5432 still blocked?**

- This is OK - we created tables in Supabase
- For local development, we'll handle this in Days 4-5
- Connection pooler (port 6543) might also be blocked by Tailscale

**Q: SQL errors when running?**

- Check Supabase output for specific error
- Most common: duplicate objects (safe to ignore with `IF NOT EXISTS`)
- Try running in chunks if needed

**Q: Tables created but code still errors?**

- That's normal - code can't connect yet
- Days 4-5 will handle payment integration which doesn't need direct DB connection
- We'll fix DB connection in later days

---

## 📝 Current .env Status

✅ Updated with Supabase connection string:

```
DATABASE_URL=postgresql://postgres:Hafidzprasetya_006@db.dbluwnepmjnhiklidbza.supabase.co:5432/postgres
```

---

## 🎯 Next After This

Once tables are created:

1. **Days 4-5**: Payment gateway integration (Xendit + Stripe)
2. **Days 6-7**: Inventory management
3. **Days 8-9**: Testing & Docker setup
4. **Days 10-14**: CI/CD & deployment

---

**Ready? Go to Step 2!** 🚀

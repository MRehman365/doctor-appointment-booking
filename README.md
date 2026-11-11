# Medical Complex — Doctor Appointment Booking & Clinic Management

Production-oriented Next.js platform for patient booking (no account), Lemon Squeezy payments, automatic Patient ID / appointment / queue numbers, PDF-ready receipts, and admin / doctor / reception dashboards.

## Stack

- **Next.js 16** (App Router) + TypeScript
- **Tailwind CSS v4**
- **MongoDB** + Mongoose
- **Cloudinary** (image uploads)
- **Lemon Squeezy** (payments + signed webhooks)
- **Nodemailer** + optional **Twilio** SMS

## Quick start

1. Copy environment variables:

```bash
cp .env.example .env.local
```

2. Set at least:

- `MONGODB_URI`
- `SESSION_SECRET` (32+ characters)
- `NEXT_PUBLIC_APP_URL`

3. Install and run:

```bash
npm install
npm run dev
```

4. Seed **Admin** + **Reception** accounts into MongoDB:

```bash
npm run seed
```

Credentials come from `.env.local` (`SEED_ADMIN_*`, `SEED_RECEPTION_*`).

### Staff accounts

| Role         | Who creates it                         |
|--------------|----------------------------------------|
| Admin        | `npm run seed` (from `.env.local`)     |
| Reception    | `npm run seed` or Admin → Staff        |
| Doctor       | **Admin Dashboard → Doctors → Add**    |

Default after seed (matches your `.env.local`):

| Role         | Email                 | Password        |
|--------------|-----------------------|-----------------|
| Admin        | admin@gmail.com       | Admin12345      |
| Receptionist | reception@gmail.com   | Reception12345  |

## Patient booking flow

1. Browse doctors / services on the public site  
2. Open **Book Appointment** (no login)  
3. Select doctor → service → date → time → patient details  
4. System creates a **pending** appointment and reserves the slot  
5. Patient pays via Lemon Squeezy (or mock checkout in development)  
6. Webhook / mock completion **verifies payment server-side**  
7. System confirms appointment, creates/reuses patient, assigns:
   - Patient ID (`PAT-2026-00001`)
   - Appointment number (`APT-2026-00001`)
   - Daily doctor queue number (`001`)
8. Receipt with QR verification is available immediately  

## Payments

### Development (`PAYMENT_MODE=mock`)

Checkout redirects to `/api/payments/mock-complete`, which confirms payment server-side.  
**Mock mode is blocked in production.**

### Production (`PAYMENT_MODE=live`)

Configure:

- `LEMONSQUEEZY_API_KEY`
- `LEMONSQUEEZY_STORE_ID`
- `LEMONSQUEEZY_VARIANT_ID`
- `LEMONSQUEEZY_WEBHOOK_SECRET`

Point Lemon Squeezy webhooks to:

`POST /api/payments/webhook`

Appointments are confirmed only after signed webhook verification (or verified mock completion in development).

## Cloudinary

Set `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` to enable staff image uploads via `POST /api/upload`.

## Notifications

- Email: configure `SMTP_*`
- SMS: configure Twilio `TWILIO_*`

If providers are missing, notifications are logged as `skipped` in the `Notification` collection.

## Dashboards

- `/login` — staff authentication  
- `/dashboard/admin` — clinic-wide management & CMS  
- `/dashboard/doctor` — services, availability, queue, consultations  
- `/dashboard/reception` — check-in, waiting queue, status updates  

## Key API routes

| Method | Path | Purpose |
|--------|------|---------|
| POST | `/api/bookings` | Create pending booking + checkout |
| GET | `/api/slots` | Dynamic available slots / calendar |
| POST | `/api/payments/webhook` | Lemon Squeezy webhook |
| GET | `/api/payments/verify` | Client success polling |
| POST | `/api/reception/check-in` | Reception check-in |
| POST | `/api/seed` | Dev seed |

## Notes

- Slot double-booking is prevented with a partial unique index and availability checks.
- Pending slots expire after `SLOT_RESERVATION_MINUTES` (default 15).
- MongoDB transactions are used when a replica set is available; standalone MongoDB falls back safely.
- Patient medical notes are stored separately with stricter staff permissions.

# Manifest with Jaya — Production Deployment & Architecture Guide

A complete guide to configuring, deploying, and operating **Manifest with Jaya** on **GoDaddy cPanel Web Hosting** with **PHP + MySQL + Razorpay Checkout**, including instructions for maintaining the standalone **WordPress Theme backup**.

---

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [Production Pre-requisites](#2-production-pre-requisites)
3. [Directory & File Structure](#3-directory--file-structure)
4. [Step-by-Step GoDaddy cPanel Deployment](#4-step-by-step-godaddy-cpanel-deployment)
   - [Step 1: Create MySQL Database & Import Schema](#step-1-create-mysql-database--import-schema)
   - [Step 2: Upload Website Files to `public_html/`](#step-2-upload-website-files-to-public_html)
   - [Step 3: Configure Environment & Razorpay Keys](#step-3-configure-environment--razorpay-keys)
   - [Step 4: Configure Razorpay Webhooks](#step-4-configure-razorpay-webhooks)
   - [Step 5: Verify Apache `.htaccess` & Security Directives](#step-5-verify-apache-htaccess--security-directives)
5. [End-to-End Payment Flow & Security Safeguards](#5-end-to-end-payment-flow--security-safeguards)
6. [Pre-Launch Testing Checklist](#6-pre-launch-testing-checklist)
   - [Testing in Sandbox / Test Mode](#testing-in-sandbox--test-mode)
   - [Switching to Live Production Payments](#switching-to-live-production-payments)
7. [Admin Panel Operations Guide](#7-admin-panel-operations-guide)
8. [WordPress Theme Backup & Parity](#8-wordpress-theme-backup--parity)
9. [Troubleshooting & Support](#9-troubleshooting--support)

---

## 1. Architecture Overview

Manifest with Jaya is built as a **high-performance hybrid architecture**:

```
                              PUBLIC WEBSITE
                 (Static HTML/CSS/JS + Dynamic Checkout)
        index.html · services.html · story.html · members.html · pay.html
                                     │
                                     ▼
                        RAZORPAY CHECKOUT MODAL
           (UPI: GPay, PhonePe, Paytm · Cards · Netbanking · Wallets)
                                     │
                             (HMAC-SHA256 Signature)
                                     ▼
                            PHP BACKEND (api/)
                 api/payment.php · api/webhook.php · api/db.php
                     - Server-enforced catalog amounts
                     - Cryptographic signature verification
                     - Automatic student provisioning
                                     │
                    ┌────────────────┴────────────────┐
                    ▼                                 ▼
            GODADDY MySQL DB                     ADMIN PANEL
          database.sql schema                     (/admin/)
   - customers       - payments           - Revenue & orders dashboard
   - invoices        - payment_events     - Custom quotation generator
                                          - Client directory & audit logs
```

- **Frontend**: Ultra-fast, SEO-optimized static HTML5, CSS3, and modern vanilla JavaScript with zero heavy framework bloat.
- **Backend API (`api/`)**: Lightweight PHP (compatible with PHP 7.4 through 8.3) supporting PDO MySQL with parameterized queries.
- **Payment Processing**: Official Razorpay Checkout integration with cryptographic HMAC-SHA256 signature verification and asynchronous webhook fail-safes.
- **Database (`database.sql`)**: MySQL/MariaDB database storing `customers`, `invoices`, `payments`, and `payment_events`.
- **WordPress Theme Backup**: Standalone, automated WordPress theme (`manifest-theme.zip`) generated with 100% parity as an independent fallback.

---

## 2. Production Pre-requisites

Before deploying to production, ensure you have the following:

### Hosting & Infrastructure
- **GoDaddy Web Hosting Account**: Linux cPanel hosting plan with:
  - PHP version: **7.4, 8.0, 8.1, 8.2, or 8.3**.
  - MySQL / MariaDB support.
  - PHP extensions enabled: `pdo`, `pdo_mysql`, `curl`, `json`, `mbstring`, `openssl`. *(All enabled by default on standard GoDaddy cPanel).*
- **Active Domain & SSL Certificate**:
  - Domain pointing to GoDaddy nameservers or hosting IP.
  - **HTTPS is mandatory** for Razorpay checkout compliance. Enable GoDaddy AutoSSL or Let's Encrypt in cPanel > **SSL/TLS Status**.

### Razorpay Merchant Account
- Registered and KYC-verified **[Razorpay Account](https://dashboard.razorpay.com/)**.
- Activated payment methods: UPI (Google Pay, PhonePe, Paytm, BHIM), Debit/Credit Cards (Visa, MasterCard, RuPay), and Netbanking.
- API Credentials (from Razorpay Dashboard > **Settings** > **API Keys**):
  - **Key ID**: `rzp_live_xxxxxxxxxxxxxx` (or `rzp_test_...` for sandbox).
  - **Key Secret**: `xxxxxxxxxxxxxxxxxxxxxxxx`.
  - **Webhook Secret**: Your chosen secret key for webhook signature validation.

---

## 3. Directory & File Structure

```
public_html/
│
├── index.html              # Homepage with hero, services, "Meet Jaya Kotta", stats & booking
├── services.html           # Services catalog with direct "Enroll & Pay Online" links
├── story.html              # My Story & Vision page detailing Jaya's 15+ year journey
├── members.html            # Member portal & recorded session player with 5-day lifespan rule
├── pay.html                # Dedicated secure Razorpay Checkout portal (standard & custom quotes)
├── disclaimer.html         # Legal, coaching, and wellness disclaimer
│
├── styles.css              # Main homepage styles
├── services.css            # Services page styles
├── story.css               # Story page styles
├── members.css             # Member portal styles
├── pay.css                 # Checkout page styles
├── site-shared.css         # Shared colors, typography, header, footer & modal styles
│
├── script.js               # Homepage interactivity (testimonials, booking modal, navigation)
├── services.js             # Services page script
├── story.js                # Story page animations
├── members.js              # Member login & player logic
├── pay.js                  # Razorpay checkout handler & cryptographic verification
├── site-shared.js          # Shared booking & inquiry modal logic
│
├── database.sql            # Master MySQL database schema (customers, invoices, payments, events)
├── .htaccess               # Production Apache configuration (HTTPS force, asset caching, file security)
│
├── api/                    # PHP Backend Endpoints
│   ├── config.php          # Database credentials, Razorpay keys, and service catalog
│   ├── .env.php            # Optional server-specific credentials file (gitignored)
│   ├── db.php              # PDO MySQL connection & optimized schema probe
│   ├── payment.php         # Order creation & HMAC-SHA256 signature verification API
│   ├── webhook.php         # Asynchronous Razorpay webhook receiver & event audit log
│   ├── members.php         # Member portal backend API
│   └── .htaccess           # Security: Blocks direct web access to sensitive config & data files
│
├── admin/                  # Instructor & Payment Management Dashboard
│   ├── index.php           # Admin dashboard, orders table, customer directory & quotation maker
│   ├── admin.css           # Admin styling
│   └── admin.js            # Admin interactions, copy link & WhatsApp share helpers
│
├── data/                   # Server-side data directory (protected by .htaccess)
│   ├── members_data.json   # Member roster & recorded weekly session data
│   └── .htaccess           # Security: Denies all direct web access
│
├── assets/                 # Brand imagery, photography, and vector graphics
│   ├── jaya/               # High-resolution optimized WebP portraits of Jaya Kotta
│   └── manifest-logo-mark.webp
│
├── manifest-theme/         # Preserved standalone WordPress Theme
├── manifest-theme.zip      # Deployable WordPress Theme archive for GoDaddy WordPress
├── convert_to_wp.py        # Automated HTML-to-WordPress converter script
└── verify_theme.py         # 100% parity verification audit script
```

---

## 4. Step-by-Step GoDaddy cPanel Deployment

### Step 1: Create MySQL Database & Import Schema

1. Log into your **GoDaddy cPanel**.
2. Under the **Databases** section, click **MySQL Database Wizard**.
3. **Step 1: Create A Database**:
   - Enter database name: `manifest_db` (cPanel will prepend your cPanel username, e.g., `cpuser_manifest_db`).
   - Click **Next Step**.
4. **Step 2: Create Database Users**:
   - Username: `manifest_user` (e.g., `cpuser_manifest_user`).
   - Password: Click **Password Generator** to create a strong password. **Copy this password** for Step 3.
   - Click **Create User**.
5. **Step 3: Add User to Database**:
   - Check the box **ALL PRIVILEGES**.
   - Click **Make Changes**.
6. **Import Schema via phpMyAdmin**:
   - Return to cPanel home and open **phpMyAdmin**.
   - Click your new database name in the left sidebar.
   - Click the **Import** tab at the top.
   - Click **Choose File** and select [`database.sql`](file:///D:/development/websites/manifest/database.sql) from your project folder.
   - Click **Go** at the bottom.
   - All 4 tables (`customers`, `invoices`, `payments`, `payment_events`) will be created instantly.

---

### Step 2: Upload Website Files to `public_html/`

You can upload files using either **cPanel File Manager** or an **FTP/SFTP Client** (FileZilla, Cyberduck):

#### Method A: Using cPanel File Manager (Recommended)
1. On your computer, select all website files and folders and compress them into a `.zip` archive (do NOT include `.git`, `.venv`, or `__pycache__`).
2. In GoDaddy cPanel, open **File Manager**.
3. Navigate into the **`public_html/`** directory.
4. Click **Upload** in the top toolbar, select your `.zip` file, and wait for the upload to complete.
5. Select the uploaded `.zip` in File Manager and click **Extract**.
6. Verify that files are placed directly inside `public_html/` (e.g., `public_html/index.html`, `public_html/api/`, `public_html/admin/`).

#### File & Directory Permissions
- Standard directories: `755`
- Standard files: `644`
- Verify that `data/` and `api/` have permissions `755`.

---

### Step 3: Configure Environment & Razorpay Keys

Open `api/config.php` (or create a file named `api/.env.php` inside `public_html/api/`) and fill in your production values:

```php
<?php
// File: public_html/api/.env.php
return [
    // 1. GoDaddy cPanel MySQL Database Credentials
    'DB_HOST' => 'localhost',
    'DB_NAME' => 'cpuser_manifest_db',     // Replace with your full cPanel DB name
    'DB_USER' => 'cpuser_manifest_user',   // Replace with your full cPanel DB user
    'DB_PASS' => 'YourStrongDbPasswordHere',
    'DB_PORT' => 3306,

    // 2. Razorpay Mode: 'test' for sandbox testing, 'live' for real payments
    'RAZORPAY_MODE' => 'live',

    // Test Keys (for development / sandbox testing)
    'RAZORPAY_TEST_KEY_ID' => 'rzp_test_xxxxxxxxxxxxxx',
    'RAZORPAY_TEST_KEY_SECRET' => 'xxxxxxxxxxxxxxxxxxxxxxxx',

    // Live Keys (for real money collection in production)
    'RAZORPAY_LIVE_KEY_ID' => 'rzp_live_xxxxxxxxxxxxxx',
    'RAZORPAY_LIVE_KEY_SECRET' => 'xxxxxxxxxxxxxxxxxxxxxxxx',

    // Webhook Secret configured in Razorpay Dashboard
    'RAZORPAY_WEBHOOK_SECRET' => 'YourChosenWebhookSecret123',

    // 3. Admin Passcode for /admin/ Dashboard
    'ADMIN_PASSCODE' => 'ChangeThisToAStrongPasscode2026'
];
```

> [!IMPORTANT]
> If you create `api/.env.php`, it is automatically detected and loaded by `api/config.php`. Direct browser requests to `.env.php` are blocked by `api/.htaccess`.

---

### Step 4: Configure Razorpay Webhooks

Configuring the webhook ensures transaction statuses are updated reliably, even if a client closes their browser before returning to your site:

1. Log into your **[Razorpay Dashboard](https://dashboard.razorpay.com/)**.
2. Navigate to **Settings** (gear icon in the bottom-left sidebar) > **Webhooks**.
3. Click **+ Add New Webhook**.
4. Fill in the webhook form:
   - **Webhook URL**:
     ```
     https://manifestwithjaya.com/api/webhook.php
     ```
     *(Replace `manifestwithjaya.com` with your actual domain).*
   - **Secret**: Enter the exact secret string you put in `RAZORPAY_WEBHOOK_SECRET` in Step 3.
   - **Alert Email**: Enter your notification email address.
   - **Active Events**: Check the following four events:
     - `order.paid`
     - `payment.captured`
     - `payment.failed`
     - `refund.processed`
5. Click **Save**.

---

### Step 5: Verify Apache `.htaccess` & Security Directives

Ensure the root [`.htaccess`](file:///D:/development/websites/manifest/.htaccess) file is in `public_html/`. It provides:

1. **HTTPS Enforcement**: Automatically redirects all `http://` traffic to secure `https://`.
2. **Access Control**: Denies direct browser access to `database.sql`, `.sqlite`, `.env`, and log files.
3. **Directory Browsing Disabled**: `Options -Indexes` prevents visitors from seeing folder file lists.
4. **Security Headers**:
   - `X-Content-Type-Options: nosniff`
   - `X-Frame-Options: SAMEORIGIN`
   - `Referrer-Policy: strict-origin-when-cross-origin`
5. **Performance**: Enables Gzip compression (`mod_deflate`) and browser caching for images, CSS, and JS.

> [!TIP]
> In cPanel File Manager, hidden files (starting with a dot like `.htaccess`) are hidden by default. Click **Settings** (top-right of File Manager) and check **Show Hidden Files (dotfiles)**.

---

## 5. End-to-End Payment Flow & Security Safeguards

1. **Client Selects Journey / Service**:
   - Standard Service: Client clicks **"Enroll & Pay Online"** on [`services.html`](file:///D:/development/websites/manifest/services.html) (e.g., DMJ ₹2,000, 1-on-1 Coaching ₹1,00,000).
   - Custom Quotation: Client opens custom link generated by Jaya: `https://manifestwithjaya.com/pay.html?inv=INV-2026-XXXX`.
2. **Order Generation (`POST api/payment.php?action=create_order`)**:
   - Server validates name, email, and phone format.
   - Server strictly enforces price from `$SERVICES_CATALOG` or from the pre-existing invoice. Client browser cannot manipulate amounts.
   - Server generates unique invoice (`INV-YYYYMM-XXXX`) and calls Razorpay Orders API via outbound HTTPS cURL.
   - Database creates record in `payments` with status `created`.
3. **Razorpay Checkout Modal**:
   - The official Razorpay modal opens displaying the exact verified amount in INR.
   - Customer completes payment via UPI QR, Google Pay, PhonePe, Card, or Netbanking.
4. **Cryptographic Verification (`POST api/payment.php?action=verify_payment`)**:
   - Razorpay returns `razorpay_order_id`, `razorpay_payment_id`, and `razorpay_signature`.
   - Backend independently calculates `hash_hmac('sha256', order_id + '|' + payment_id, secret)` using `hash_equals()`.
   - **Crucial Rule**: The payment status is updated to `paid` **only** if the cryptographic signature matches 100%.
5. **Instant Student Provisioning & Receipt**:
   - If the service is DMJ or includes coaching, the student is automatically provisioned into `data/members_data.json`.
   - The user receives an instant printable confirmation receipt with their Payment ID and a direct button to enter the Member Portal.
6. **Webhook Redundancy**:
   - If the client's phone battery dies or browser closes before signature return, Razorpay's server sends an `order.paid` webhook to `api/webhook.php`.
   - The webhook verifies the signature, audits the payload in `payment_events`, and marks the invoice as paid.

---

## 6. Pre-Launch Testing Checklist

### Testing in Sandbox / Test Mode

1. In `api/config.php` (or `api/.env.php`), set:
   ```php
   'RAZORPAY_MODE' => 'test',
   'RAZORPAY_TEST_KEY_ID' => 'rzp_test_xxxxxxxxxxxxxx',
   'RAZORPAY_TEST_KEY_SECRET' => 'xxxxxxxxxxxxxxxxxxxxxxxx',
   ```
2. Open `https://manifestwithjaya.com/pay.html?service=dmj-monthly`.
3. Enter test details:
   - Name: `Priya Test`
   - Email: `priya.test@example.com`
   - Phone: `9876543210`
4. Click **Proceed to Secure Payment**.
5. When the Razorpay test modal opens:
   - Select **UPI** > Enter `success@razorpay` (or select **Card** > use Razorpay Test Card numbers).
   - Click **Pay**.
6. Verify:
   - Successful confirmation screen appears with a Payment ID (`pay_...`).
   - Log into `/admin/` > Check that the payment appears under **Transactions & Orders** with green badge **PAID**.
   - Open `/members.html` > Enter `priya.test@example.com` > Verify portal grants immediate access.

---

### Switching to Live Production Payments

1. In `api/config.php` (or `api/.env.php`), update:
   ```php
   'RAZORPAY_MODE' => 'live',
   'RAZORPAY_LIVE_KEY_ID' => 'rzp_live_xxxxxxxxxxxxxx',
   'RAZORPAY_LIVE_KEY_SECRET' => 'xxxxxxxxxxxxxxxxxxxxxxxx',
   'RAZORPAY_WEBHOOK_SECRET' => 'YourProductionWebhookSecret',
   ```
2. In Razorpay Dashboard > Switch to **Live Mode** > Ensure Webhooks point to `https://manifestwithjaya.com/api/webhook.php`.
3. Perform a real payment test:
   - In `/admin/`, create a custom quotation for ₹1.00 or ₹10.00.
   - Open the generated payment link on your mobile phone.
   - Complete payment using your real UPI app (GPay / PhonePe).
   - Confirm receipt generation and verify funds appear in your Razorpay Live Dashboard.
   - Refund the test transaction from Razorpay Dashboard if desired.

---

## 7. Admin Panel Operations Guide

Access the management dashboard at:
```
https://manifestwithjaya.com/admin/
```

- **Passcode**: Enter your configured `ADMIN_PASSCODE` (default: `jaya2026`).
- **Security Features**:
  - Automatically rate-limits and locks out after 5 consecutive failed attempts (15-minute lockout).
  - CSRF-protected mutation endpoints.

### Core Admin Capabilities:

1. **Dashboard Metrics**:
   - Total Collected Revenue in INR.
   - Number of Verified Paid Transactions.
   - Active & Pending Invoices.
   - Total Registered Client Profiles.
2. **Orders & Transactions Table**:
   - View real-time transactions with client name, email, phone, service, amount, and Razorpay Order/Payment IDs.
   - Real-time search filter by customer name, email, or order ID.
3. **Custom Quotation & Payment Link Maker**:
   - For corporate workshops, private coaching, or customized packages:
     - Enter Client Name, Email, Phone, Scope of Work, Custom Amount (₹), Due Date, and Terms.
     - Click **Generate Quotation & Payment Link**.
     - An official invoice is created in the database and an instant 1-click link is generated:
       `https://manifestwithjaya.com/pay.html?inv=INV-2026-XXXX`
     - Use the **Copy Link** or **Share on WhatsApp** buttons to deliver the quotation directly to the client.
4. **Customer Directory**:
   - Comprehensive roster of all paying clients, their contact information, total paid sessions, and lifetime value.
5. **Webhook Audit Trail**:
   - Live log of all event notifications received from Razorpay servers. Click **View JSON** to inspect full payload data for debugging or auditing.

---

## 8. WordPress Theme Backup & Parity

If you ever wish to deploy the website as a WordPress theme on GoDaddy Managed WordPress or any WordPress installation:

- **Theme Directory**: [`manifest-theme/`](file:///D:/development/websites/manifest/manifest-theme)
- **Ready-to-Upload Archive**: [`manifest-theme.zip`](file:///D:/development/websites/manifest/manifest-theme.zip)

### How to Re-generate Theme:
If you make future edits to static HTML/CSS files, rebuild the theme with:
```powershell
python convert_to_wp.py
```

### How to Run Parity Verification:
Run the automated parity verification script:
```powershell
python verify_theme.py
```
This tests and confirms:
- 100% of asset images and stylesheets match.
- 100% of interactive DOM IDs (modals, forms, inputs) match between HTML and WordPress PHP templates.
- 0 unmapped assets or broken links.

---

## 9. Troubleshooting & Support

### Issue 1: "Could not initiate Razorpay order"
- **Cause**: Invalid Razorpay Key ID or Secret, or cURL outbound HTTPS connection blocked by hosting firewall.
- **Fix**: Check `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET` in `api/config.php`. Verify that your GoDaddy server allows outbound HTTPS requests on port 443 (standard on all cPanel plans).

### Issue 2: "Payment signature verification failed"
- **Cause**: Mismatch between `RAZORPAY_KEY_SECRET` on server and the secret of the key used by the frontend checkout script.
- **Fix**: Ensure that `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET` belong to the exact same key pair in your Razorpay Dashboard.

### Issue 3: Webhook status not updating
- **Cause**: Webhook URL misconfigured, or secret mismatch.
- **Fix**: Open `/admin/` > **Webhook Audit Trail**. If entries are marked **Unverified**, the `RAZORPAY_WEBHOOK_SECRET` in `api/config.php` does not match the secret entered in Razorpay Dashboard.

### Issue 4: Database connection fails on GoDaddy
- **Cause**: cPanel prepends your cPanel username to database names and users.
- **Fix**: Ensure `DB_NAME` and `DB_USER` use the full prefix (e.g., `cpuser_manifest_db`, not just `manifest_db`).

---

### Production Contact & Maintenance
- **Website**: [www.manifestwithjaya.com](https://manifestwithjaya.com)
- **Support Email**: `contact@manifestwithjaya.com`
- **Phone / WhatsApp**: `+91 80978 36882`
- **Instagram**: `@manifestwithjaya101`

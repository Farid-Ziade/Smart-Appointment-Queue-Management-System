# Smart Appointment & Queue Management System

A full-stack application for managing customer appointments, staff availability, and a live service queue. Customers book appointments, staff manage assigned bookings, and administrators manage services, schedules, and reports.

The frontend uses React with JavaScript. The backend uses Express with TypeScript and stores data in MongoDB.

## Features

- Customer registration, login, and logout with JWT authentication and bcrypt password hashing.
- Backend checks for roles, appointment ownership, and staff assignment.
- Service creation, editing, activation, and deactivation.
- Staff accounts, service qualifications, weekly working hours, breaks, and days off.
- Appointment availability, booking, confirmation, rescheduling, and cancellation.
- Protection against overlapping bookings and repeated booking requests.
- Check-in, daily queue numbers, administrator priority, and call/start/complete actions.
- Live queue updates through Socket.IO.
- Administrator dashboard with appointment totals, completed-service revenue, and a seven-day chart.
- SMTP notifications for confirmation, cancellation, rescheduling, and no-shows.
- Scheduled processing of missed confirmed appointments and pending notifications.

## Technology stack

| Area                     | Technologies                          |
| ------------------------ | ------------------------------------- |
| Frontend                 | React, Vite, React Router             |
| HTTP requests and forms  | Axios, interceptors, Yup              |
| Backend                  | Node.js, Express, TypeScript, tsx     |
| Database                 | MongoDB Atlas, Mongoose, transactions |
| Authentication           | JSON Web Tokens, bcrypt               |
| Live updates             | Socket.IO                             |
| Email and scheduled jobs | Nodemailer, node-cron                 |
| Dates and timezones      | Luxon                                 |

## User roles

| Role          | Permissions                                                                                                                         |
| ------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| Customer      | Register, log in, view available times, book appointments, and view, reschedule, or cancel their own eligible appointments.         |
| Staff         | View assigned appointments, confirm bookings, manage eligible assigned appointments, check customers in, and operate their queue.   |
| Administrator | Manage services, create staff accounts, configure schedules, manage all appointments and queues, adjust priority, and view reports. |

Public registration always creates a **customer**. Administrator and staff roles cannot be selected through public signup. Only customers create appointment bookings; administrators oversee them through the management screens.

## Getting started

The commands below use **Windows PowerShell** and run from the repository root unless stated otherwise.

### 1. Prerequisites

- Git.
- Node.js 22.18 or a compatible newer version, with npm.
- MongoDB Atlas or a local MongoDB replica set.
- SMTP credentials if email delivery is needed.

A standalone local MongoDB server does not support the transactions required by this application.

### 2. Clone and install

```powershell
git clone https://github.com/Farid-Ziade/Smart-Appointment-Queue-Management-System.git
cd Smart-Appointment-Queue-Management-System

npm --prefix backend ci
npm --prefix frontend ci
```

If the project is already on your computer, open its root folder and run the two installation commands.

### 3. Configure the backend

Create `backend/.env` without overwriting an existing configuration:

```powershell
if (-not (Test-Path backend/.env)) {
    Copy-Item backend/.env.example backend/.env
}
```

Generate a JWT signing secret:

```powershell
node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"
```

Copy the generated value into `JWT_SECRET` and complete `backend/.env`:

```dotenv
PORT=5000
MONGODB_URI=YOUR_ATLAS_CONNECTION_STRING_WITH_DATABASE_NAME
JWT_SECRET=YOUR_GENERATED_64_CHARACTER_HEX_SECRET
BUSINESS_TIME_ZONE=Asia/Beirut
CURRENCY=USD
SLOT_MINUTES=15
NO_SHOW_GRACE_MINUTES=15
WEB_ORIGIN=http://localhost:5173

MAIL_MODE=disabled
SMTP_HOST=
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=
SMTP_PASSWORD=
SMTP_FROM=
```

Replace both placeholders before starting the backend. Get the MongoDB URI from your Atlas cluster's connection settings. Include an explicit database name, such as `smart_appointments`, and allow the backend computer's IP address in Atlas Network Access. The database user needs access to that database; special characters in URI credentials must be URL-encoded.

| Setting                 | Purpose                                                                            |
| ----------------------- | ---------------------------------------------------------------------------------- |
| `PORT`                  | Backend HTTP port; defaults to `5000`.                                             |
| `MONGODB_URI`           | Database connection string, including the target database.                         |
| `JWT_SECRET`            | Signing key: exactly 64 hexadecimal characters.                                    |
| `BUSINESS_TIME_ZONE`    | Timezone for schedules, business dates, queues, and reports.                       |
| `CURRENCY`              | Display currency; defaults to `USD`.                                               |
| `SLOT_MINUTES`          | Spacing between available start times; defaults to `15` and must divide 60 evenly. |
| `NO_SHOW_GRACE_MINUTES` | Grace period after a confirmed appointment's start; defaults to `15`.              |
| `WEB_ORIGIN`            | Frontend origin allowed for Socket.IO connections.                                 |
| `MAIL_MODE`             | `disabled`, `preview`, or `smtp`.                                                  |

Restart the backend after changing environment settings. Keep credentials in `backend/.env`, which is ignored by Git. Commit `.env.example` with safe placeholders. MongoDB credentials, SMTP credentials, and JWT signing secrets belong on the backend, never in frontend code or `VITE_` variables.

### 4. Create the first administrator

Run this once to create your initial administrator. The password prompt hides your input:

```powershell
$adminPassword = Read-Host "Choose an administrator password" -AsSecureString
try {
    $env:ADMIN_PASSWORD = [System.Net.NetworkCredential]::new("", $adminPassword).Password
    npm --prefix backend run admin:create
} finally {
    Remove-Item Env:ADMIN_PASSWORD -ErrorAction SilentlyContinue
    Remove-Variable adminPassword -ErrorAction SilentlyContinue
}
```

The script asks for a full name, email, and phone number. Passwords must contain at least 8 characters and no more than 72 UTF-8 bytes.

The account is saved in the configured MongoDB database. Existing emails are rejected; the command does not promote existing customers. After creation, use the normal website login page with the administrator's email and password.

### 5. Start the application

In the first terminal:

```powershell
npm --prefix backend run dev
```

In a second terminal, also at the repository root:

```powershell
npm --prefix frontend run dev
```

Open [http://localhost:5173](http://localhost:5173). The backend runs on port `5000`; its health endpoint is [http://localhost:5000/api/health](http://localhost:5000/api/health).

Vite forwards `/api` and `/socket.io` to the backend. Axios uses `/api` as its base URL, so no frontend `.env` is required for this local setup. If the backend port changes, update the targets in `frontend/vite.config.js`. If the frontend origin changes, update `WEB_ORIGIN`.

## First booking workflow

1. Log in as an administrator and open **Services**.
2. Add a service with its name, description, duration, and price. Enter a price such as `25.00`; it is stored as integer cents.
3. Open **Staff & schedules**, create a staff account, and select its qualified services.
4. Add working intervals, such as `09:00-12:00` and `13:00-17:00`, and any days off.
5. Register and log in as a customer in a separate browser profile or private window.
6. Choose a service, staff member, date, and available time, then submit the booking.
7. As the assigned staff member or administrator, confirm the appointment.
8. On its business date, check the customer in, call the next customer, start service, and mark it complete.

Services need qualified staff with working hours before customers can find bookable slots.

## Booking and queue rules

- New appointments start as `Pending`; confirmation changes them to `Confirmed`.
- The backend calculates the end time from the service duration and validates the full interval.
- Start times must be in the future, on the configured slot grid, and within the next year.
- An appointment must fit within one working interval. Separate intervals represent breaks; overnight shifts are not supported.
- Rescheduling preserves the reference, original price, and duration, and returns the appointment to `Pending`. If the new slot is unavailable, the original reservation stays intact.
- Deactivating a service prevents new bookings while preserving its historical appointments.
- Dates are stored as UTC instants. Business-day rules use `BUSINESS_TIME_ZONE`.
- Check-in requires a confirmed appointment on the same business date and within the grace-period limit. Early same-day arrivals are allowed.
- Daily queue numbers are unique. Higher administrator-assigned priority is called first, followed by arrival order.
- A staff member can have one called or in-service customer at a time.
- Queue entries progress through `Waiting`, `Called`, `InService`, and `Completed`. Calling changes the queue entry; the appointment remains `CheckedIn` until service starts.
- Cancelled and completed entries leave the active queue but remain in history.
- The no-show job runs every minute and changes only overdue `Confirmed` appointments to `NoShow`.

## Email configuration

| Mode                 | Behavior                                                                                    |
| -------------------- | ------------------------------------------------------------------------------------------- |
| `MAIL_MODE=disabled` | Stores pending notifications without sending them.                                          |
| `MAIL_MODE=preview`  | Prints messages in the backend terminal and marks them processed. No inbox delivery occurs. |
| `MAIL_MODE=smtp`     | Sends notifications through the configured SMTP provider.                                   |

For SMTP, complete these fields in `backend/.env` using your provider's credentials:

```dotenv
MAIL_MODE=smtp
SMTP_HOST=YOUR_PROVIDER_HOST
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=YOUR_SMTP_USERNAME
SMTP_PASSWORD=YOUR_SMTP_PASSWORD
SMTP_FROM=YOUR_AUTHORIZED_SENDER_ADDRESS
```

Follow the provider's port settings. Port `587` normally uses STARTTLS with `SMTP_SECURE=false`; port `465` normally uses `SMTP_SECURE=true`.

Restart the backend. The email worker checks for eligible notifications every five seconds. To verify delivery, book using an email address you control and confirm the appointment through a staff or administrator account. SMTP sandboxes capture messages in a test inbox; use live-sending credentials for delivery to actual customer inboxes.

Pending notifications created while sending was disabled become eligible when SMTP is enabled. Previewed notifications are already marked processed and are not resent after switching modes.

Appointment changes and their email events are saved in the same transaction. Failed delivery is retried with increasing delays. A crash after provider acceptance but before recording success can cause a duplicate; exactly-once SMTP delivery is not guaranteed.

## Build and checks

```powershell
npm --prefix backend run typecheck
npm --prefix backend run build
npm --prefix frontend run lint
npm --prefix frontend run build
```

After both builds finish, start the built application:

```powershell
npm --prefix backend start
```

The backend serves `frontend/dist`. For local use on port `5000`, set `WEB_ORIGIN=http://localhost:5000` and open [http://localhost:5000](http://localhost:5000). For hosting, set `WEB_ORIGIN` to the HTTPS origin and `NODE_ENV=production`, and configure the backend environment on the host.

## Using another computer

Accounts, services, and appointments are stored in MongoDB. To use them from another local copy, connect its backend to the same Atlas cluster **and database name**, allow that backend's IP address in Atlas, and log in again. Git does not copy the ignored `.env` file.

If the application is hosted, open its website URL; visitors do not need database credentials. `localhost` refers to the computer opening the address, not automatically to the original development computer.

## Current limitations

- Access tokens last one hour. Persistent sessions and refresh tokens are not implemented; logout revokes the current token on the backend.
- Socket broadcasts and in-memory rate limits assume one application instance. Multiple instances need shared coordination and a consistent signing key for shared tokens.
- Prices use integer cents and two-decimal display amounts.
- QR scanning, PDF booking confirmations, waiting-time estimates, and Docker Compose are not included.

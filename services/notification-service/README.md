# Notification Service

Sends notification emails for Terp EventSphere using SendGrid.

## Endpoints
- POST /api/notifications/registration-confirmed
- POST /api/notifications/waitlist-confirmed
- POST /api/notifications/waitlist-success
- POST /api/notifications/event-cancelled

All endpoints accept JSON payloads documented in the controller code.

## Environment variables
- PORT (default 3004)
- SENDGRID_API_KEY (required to send emails)
- SENDGRID_FROM_EMAIL (optional, default `noreply@terpeventsphere.edu`)

## Run
Install dependencies and start the service:

```powershell
cd services\notification-service
npm install
npm start
```

## Test
```powershell
npm test
```

## Notes
- In local development, tests stub the `sendgridClient` to avoid real email sends.
- Consider adding templating and SendGrid dynamic templates for production usage.

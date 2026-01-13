# TelcoCredit PNG (Corporate Mobile Credit Platform)

This repo implements:
- Employer onboarding + dashboards
- Employee MSISDN linking + allowances
- SMS topup requests with reserve/capture ledger
- Telco connectors: Digicel USSD via SIM gateway + Vodafone API/USSD stubs
- Automated month-end invoices + PDF + XLSX + email
- Admin controls + fraud limits + reconciliation jobs

## Run locally
1) `docker compose up -d`
2) `pnpm install`
3) `cp apps/api/.env.example apps/api/.env`
4) `cp apps/web/.env.example apps/web/.env`
5) `pnpm db:migrate`
6) `pnpm db:seed`
7) `pnpm dev`

Web: http://localhost:3000  
API: http://localhost:4000

## Default seeded users
- Super Admin:
  - email: admin@telcocredit.local
  - password: Admin123!

- Sample Employer Admin:
  - email: acme.admin@telcocredit.local
  - password: Admin123!

## SMS Simulator
To simulate inbound SMS locally:
`curl -X POST http://localhost:4000/webhooks/sms/inbound -H "Content-Type: application/json" -d '{"from":"+67570123456","text":"TOPUP 5","messageId":"m1"}'`

You'll get a JSON response with what would be sent back as SMS.

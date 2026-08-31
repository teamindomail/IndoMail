# IndoMail

IndoMail is a clean, secure email client being built as a real application.

## Stack
- Frontend: HTML, CSS, JavaScript
- Backend: Node.js
- Repository and version control: GitHub
- Providers: Google and Zoho through secure official authentication flows

## Current foundation
- Responsive IndoMail login experience
- Google and Zoho login entry points
- Email + password entry UI
- Responsive inbox shell
- Node.js static server
- Health endpoint: `/api/health`

## Development workflow
Build one feature at a time, test it, fix bugs, then push the working version to `main`.

## Security
IndoMail will not store users' raw Google or Zoho passwords. Provider authentication will use secure official flows and tokens.

## Local run
```bash
npm start
```
Then open `http://localhost:3000`.

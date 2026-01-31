# Contoso Claims - Frontend

Next.js 15 frontend application built with shadcn/ui for the Contoso Claims multi-agent insurance platform.

## Features

- **Next.js 15** with App Router
- **React 19** with latest features
- **shadcn/ui** components for beautiful UI
- **Tailwind CSS v4** for styling
- **TypeScript** for type safety
- **Real-time agent workflow visualization**
- **Interactive agent testing pages**
- **Document management interface**
- **Demo claim scenarios**

## Local Development

```bash
cd frontend
npm install --legacy-peer-deps
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Troubleshooting

### React 19 Compatibility

If you encounter peer dependency errors, use the legacy peer deps flag:

```bash
npm install --legacy-peer-deps
```

This is due to some packages not yet supporting React 19.

## Environment Variables

For local development, the frontend automatically connects to `http://localhost:8000` for the backend API.

In production (Azure Container Apps), it automatically detects and connects to the deployed backend.

## Adding shadcn/ui Components

```bash
npx shadcn@latest add button
npx shadcn@latest add button card dialog
```

## Application Routes

- `/` - Home page with project overview
- `/demo` - Complete multi-agent workflow demo
- `/agents/claim-assessor` - Individual claim assessor testing
- `/agents/policy-checker` - Policy verification testing
- `/agents/risk-analyst` - Risk analysis testing
- `/agents/communication-agent` - Communication generation testing
- `/documents` - Document management
- `/documents/manage` - Upload and manage policy documents
- `/documents/index-management` - Vector index management

## Deployment

This frontend deploys to Azure Container Apps alongside the FastAPI backend:

```bash
azd auth login
azd up
```

## Learn More

- [Next.js Documentation](https://nextjs.org/docs)
- [shadcn/ui Documentation](https://ui.shadcn.com)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)

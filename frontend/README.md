# Frontend - Task Manager UI

Next.js 15 frontend application built with shadcn/ui components for the Task Manager.

## Features

- **Next.js 15** with App Router
- **React 19** with latest features
- **shadcn/ui** components for beautiful UI
- **Tailwind CSS v4** for styling
- **TypeScript** for type safety

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

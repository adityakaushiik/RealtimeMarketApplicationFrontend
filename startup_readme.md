# Startup Guide

This guide explains how to build and run the Realtime Market Application Frontend.

## Prerequisites

- Node.js (Latest LTS recommended)
- npm or yarn

## Installation

1. Install dependencies:
   ```bash
   npm install
   ```

## Environment Configuration

The application uses environment variables for configuration. Two environment files have been created for you:

- `.env.development`: Used when running in development mode (`npm run dev`).
  ```
  VITE_API_BASE_URL=http://localhost:8000
  VITE_WS_URL=ws://localhost:8000/ws
  ```

- `.env.production`: Used when building for production (`npm run build`).
  ```
  VITE_API_BASE_URL=http://15.206.147.192:8000
  VITE_WS_URL=ws://15.206.147.192:8000/ws
  ```

You can modify these files to point to different backend servers as needed.

## Running in Development Mode

To start the development server with hot-reload:

```bash
npm run dev
```

The application will be available at `http://localhost:5173` (default Vite port). It will use the configuration from `.env.development`.

## Building for Production

To build the application for production:

```bash
npm run build
```

This will compile the TypeScript code and bundle the assets into the `dist` directory. The build uses the configuration from `.env.production` by default.

## Running the Production Build

To preview the production build locally:

```bash
npm run preview
```

or use a static file server to serve the `dist` directory.

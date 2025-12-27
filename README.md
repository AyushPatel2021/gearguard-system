# GearGuard - Maintenance Management System

A robust, full-stack maintenance management system designed for clear workflows, role-based access, and engineering fundamentals. GearGuard streamlines equipment tracking, maintenance checking, and operational efficiency through a modern, responsive interface.

## Tech Stack

### Frontend
- **Framework**: [React](https://react.dev/) (v18)
- **Routing**: [Wouter](https://github.com/molefrog/wouter) for lightweight routing
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) with `tailwindcss-animate`
- **UI Components**: [Radix UI](https://www.radix-ui.com/) primitives & [Lucide React](https://lucide.dev/) icons
- **State/Data Fetching**: [TanStack Query](https://tanstack.com/query/latest) (React Query)
- **Forms**: [React Hook Form](https://react-hook-form.com/) + [Zod](https://zod.dev/) validation
- **Animations**: [Framer Motion](https://www.framer.com/motion/)
- **Charts**: [Recharts](https://recharts.org/)

### Backend
- **Runtime**: [Node.js](https://nodejs.org/)
- **Framework**: [Express.js](https://expressjs.com/)
- **Database**: [PostgreSQL](https://www.postgresql.org/)
- **ORM**: [Drizzle ORM](https://orm.drizzle.team/)
- **Authentication**: [Passport.js](https://www.passportjs.org/) (Local Strategy) with session support
- **WebSockets**: `ws` for real-time updates

### Tooling
- **Build Tool**: [Vite](https://vitejs.dev/)
- **Language**: [TypeScript](https://www.typescriptlang.org/)

## Features

- **Role-Based Access Control (RBAC)**: Distinct interfaces for Admin, Technician, and Employee roles.
- **Equipment Management**: Comprehensive tracking of assets, including specifications, warranties, and status history.
- **Maintenance Workflows**:
    - **Corrective**: Reactive repairs with priority tracking.
    - **Preventive**: Scheduled maintenance based on time or usage.
- **Kanban Board**: Drag-and-drop interface for managing maintenance request lifecycles.
- **Dashboards**: Interactive charts and KPI metrics for monitoring system health and activity.
- **Responsive Design**: Optimized for desktop and tablet usage in industrial environments.

## Prerequisites

Before starting, ensure you have the following installed:
- [Node.js](https://nodejs.org/) (v20 or higher)
- [PostgreSQL](https://www.postgresql.org/) (v15 or higher)

## Setup & Installation

1.  **Clone the repository**
    ```bash
    git clone <repository-url>
    cd gearguard-system
    ```

2.  **Install dependencies**
    ```bash
    npm install
    ```

3.  **Database Setup**
    First, ensure you have PostgreSQL installed and running. Then create the database:
    ```bash
    createdb -U postgres gearguard_db
    ```

4.  **Configure Environment Variables**
    Copy the example environment file to create your local `.env`:
    ```bash
    cp example.env .env
    ```
    Then edit `.env` with your specific configuration (database credentials, secrets, etc.).

5.  **Database Migration**
    Push the schema to your PostgreSQL database:
    ```bash
    npm run db:push
    ```

6.  **Start the Development Server**
    This command starts both the backend API and the frontend dev server concurrently:
    ```bash
    npm run dev
    ```
    The application will be available at `http://localhost:5000` (or the port specified in your console).

## Project Structure

```
├── client/                 # Frontend React application
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── hooks/          # Custom React hooks
│   │   ├── lib/            # Utility functions (api, queryClient)
│   │   └── pages/          # Application views/routes
├── server/                 # Backend Express application
│   ├── routes.ts           # API route definitions
│   ├── auth.ts             # Authentication logic (Passport config)
│   └── storage.ts          # Database interaction layer
├── shared/                 # Shared code between frontend and backend
│   └── schema.ts           # Drizzle schema & Zod types
├── drizzle.config.ts       # Drizzle Kit configuration
├── tailwind.config.ts      # Tailwind CSS configuration
└── vite.config.ts          # Vite configuration
```

## Scripts

- `npm run dev`: Start the development server (Backend + Frontend).
- `npm run build`: Build the application for production.
- `npm run start`: Start the production server.
- `npm run db:push`: Push Drizzle schema changes to the database.
- `npm run check`: Run TypeScript type checking.

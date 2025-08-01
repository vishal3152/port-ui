# Portfolio Tracker Pro

## Overview

Portfolio Tracker Pro is a comprehensive investment portfolio management application built with React and Express. It provides users with the ability to track their investment holdings, monitor performance metrics, manage transactions, and analyze portfolio allocation across different asset classes and geographical regions. The application features real-time market data integration, currency conversion capabilities, and detailed portfolio analytics with visual charts and reports.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

The client-side application is built using React with TypeScript and follows a modern component-based architecture:

- **UI Framework**: Utilizes shadcn/ui component library built on top of Radix UI primitives for consistent, accessible interface components
- **Styling**: Implements Tailwind CSS with custom design tokens and CSS variables for theming, supporting both light and dark modes
- **State Management**: Uses TanStack Query (React Query) for server state management, caching, and data synchronization
- **Routing**: Employs Wouter for lightweight client-side routing
- **Form Handling**: Integrates React Hook Form with Zod for type-safe form validation
- **Build System**: Vite serves as the build tool and development server with hot module replacement

The frontend structure follows a feature-based organization with shared UI components, custom hooks for reusable logic, and dedicated pages for different application views.

### Backend Architecture

The server-side application uses Express.js with TypeScript following a RESTful API design:

- **Framework**: Express.js handles HTTP requests, middleware, and routing
- **Data Layer**: Implements a storage abstraction interface (`IStorage`) to separate business logic from data persistence concerns
- **API Structure**: RESTful endpoints organized by resource type (portfolios, holdings, transactions, currencies, market data)
- **Validation**: Uses Zod schemas shared between client and server for consistent data validation
- **Error Handling**: Centralized error handling middleware for consistent API responses

The backend follows a modular architecture with clear separation between routing, business logic, and data access layers.

### Data Storage Solutions

The application uses PostgreSQL as the primary database with Drizzle ORM for type-safe database operations:

- **Database**: PostgreSQL provides ACID compliance and complex querying capabilities needed for financial data
- **ORM**: Drizzle ORM offers type-safe database operations with schema-first approach
- **Schema Management**: Database schema is defined in TypeScript with automatic migration generation
- **Connection**: Uses Neon Database serverless PostgreSQL for cloud deployment

The database schema includes tables for portfolios, holdings, transactions, currencies, and market data with proper relationships and constraints.

### External Dependencies

#### UI and Styling Libraries
- **Radix UI**: Provides headless, accessible UI primitives for complex components like dialogs, dropdowns, and form controls
- **Tailwind CSS**: Utility-first CSS framework for rapid UI development with consistent design system
- **Lucide React**: Icon library providing consistent iconography throughout the application
- **Class Variance Authority**: Utility for creating type-safe component variants with Tailwind

#### Data Management and Validation
- **TanStack Query**: Handles server state management, caching, background updates, and optimistic updates
- **Zod**: Schema validation library used for runtime type checking and form validation
- **React Hook Form**: Form library with performance optimizations and minimal re-renders
- **date-fns**: Date manipulation library for handling financial data timestamps

#### Development and Build Tools
- **Vite**: Fast build tool and development server with hot module replacement
- **TypeScript**: Provides static type checking and enhanced developer experience
- **ESBuild**: Fast JavaScript bundler used by Vite for production builds

#### Database and Backend
- **Drizzle ORM**: Type-safe ORM with PostgreSQL support and automatic migration generation
- **Neon Database**: Serverless PostgreSQL database service for cloud deployment
- **Express Session**: Session management for user authentication and state persistence

The application architecture prioritizes type safety, performance, and maintainability through careful selection of modern tools and libraries that work well together in the React/Node.js ecosystem.
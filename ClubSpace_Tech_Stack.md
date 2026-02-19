# ClubSpace -- Technical Stack Document

## 1. Architecture Overview

Frontend (Vercel) → Supabase (Auth + DB) → Cloudinary (Media CDN)

Goal: 100% free-tier friendly and scalable MVP.

------------------------------------------------------------------------

## 2. Frontend

### Core

-   React (Vite)
-   TypeScript (strict)
-   Tailwind CSS

### Libraries

-   React Router
-   React Hook Form
-   React Query
-   Lucide React icons

### Responsibilities

-   UI rendering
-   Form handling
-   Client validation
-   Upload orchestration

------------------------------------------------------------------------

## 3. Backend (BaaS)

### Supabase Usage

Used for: - Authentication - PostgreSQL database - Row-level security -
Role management

Not used for: - Heavy media storage

------------------------------------------------------------------------

## 4. Media Infrastructure

### Cloudinary

Used for: - Image storage - Video storage - CDN delivery - Media
optimization

Upload Flow: Client → Cloudinary → secure_url → Supabase metadata

------------------------------------------------------------------------

## 5. Hosting

### Frontend Hosting

-   Vercel (free tier)
-   Automatic CI/CD
-   Edge CDN

### Database Hosting

-   Supabase managed Postgres

------------------------------------------------------------------------

## 6. Security Strategy

-   Environment variables for secrets
-   Supabase RLS policies
-   One reaction per user constraint
-   File size limits
-   Role-based access

------------------------------------------------------------------------

## 7. Performance Strategy

-   React Query caching
-   Cloudinary CDN delivery
-   Lazy image loading
-   Monthly feed filtering
-   Optimistic UI updates

------------------------------------------------------------------------

## 8. Future Scalability

Planned upgrades: - Edge functions - AI scoring - Mobile app - Advanced
analytics - Event integrations

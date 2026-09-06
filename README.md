A modern full-stack e-commerce application built with **Next.js 16**, **React 19**, **TypeScript**, **Tailwind CSS v4**, **shadcn/ui**, **Prisma 7**, **PostgreSQL**, and **Auth.js**.

This project started from an older Next.js e-commerce tutorial and has been progressively modernized to use current APIs, patterns, and dependencies instead of following outdated implementations directly.

## 🚀 Project Overview

Prostore is a full-stack e-commerce application designed to provide a complete shopping experience, including:

- Product browsing and product details
- PostgreSQL database integration
- Product data managed with Prisma ORM
- User registration and authentication
- Credentials-based sign in and sign out
- JWT-based sessions
- Protected account and admin routes
- Guest and authenticated shopping carts
- Add-to-cart functionality
- Server Actions for server-side operations
- Form validation using Zod
- Responsive UI with Tailwind CSS
- Modern component architecture using shadcn/ui and Base UI

The project is being developed incrementally, with each feature implemented and tested before moving to the next part of the application.

## 🛠️ Technology Stack

### Frontend

- **Next.js 16**
- **React 19**
- **TypeScript**
- **Tailwind CSS v4**
- **shadcn/ui**
- **Base UI**
- **Lucide React**
- **next-themes**

### Backend

- **Next.js App Router**
- **Server Components**
- **Server Actions**
- **Auth.js / NextAuth**
- **Prisma 7**
- **PostgreSQL**
- **Neon PostgreSQL**

### Validation & Authentication

- **Zod 4**
- **bcrypt-ts-edge**
- **Auth.js Credentials Provider**
- **JWT sessions**
- **Prisma Adapter**

### Deployment

- **GitHub**
- **Vercel**
- **Neon PostgreSQL**

## 🏗️ Architecture

The project follows the modern Next.js App Router architecture.

```text
                    Prostore
                       │
              ┌────────┴────────┐
              │                 │
           Frontend           Backend
              │                 │
       Next.js App Router   Server Actions
       React Server         Auth.js
       Components           Prisma 7
       Client Components    PostgreSQL
              │                 │
              └────────┬────────┘
                       │
                  PostgreSQL
```

The application uses **Server Components by default**, with Client Components introduced only when browser-side interactivity is required.

Database operations are kept on the server and accessed through Server Actions or server-side functions rather than directly from client components.

## 📁 Project Structure

The project uses route groups to separate application sections while keeping clean URLs.

```text
app/
├── (root)/
│   ├── layout.tsx
│   └── page.tsx
│
├── (auth)/
│   ├── layout.tsx
│   ├── sign-in/
│   │   ├── page.tsx
│   │   └── credentials-signin-form.tsx
│   └── sign-up/
│       ├── page.tsx
│       └── signup-form.tsx
│
└── api/
    └── auth/
        └── [...nextauth]/
            └── route.ts

components/
├── shared/
│   ├── header/
│   └── product/
│
└── ui/

db/
├── sample-data.ts
└── seed.ts

lib/
├── actions/
│   ├── product.actions.ts
│   ├── user.actions.ts
│   └── cart.actions.ts
├── constants/
├── generated/
│   └── prisma/
├── prisma.ts
├── utils.ts
└── validator.ts

prisma/
├── migrations/
└── schema.prisma

types/
└── index.ts

auth.config.ts
auth.ts
proxy.ts
prisma.config.ts
```

## 🗄️ Database

The application uses **Prisma 7** with PostgreSQL.

The Prisma schema currently contains models for:

- `Product`
- `User`
- `Account`
- `Session`
- `VerificationToken`
- `Cart`
- `Order`
- `OrderItem`
- `Review`

The project uses Prisma's modern `prisma-client` generator with a generated client stored under:

```text
lib/generated/prisma
```

Database connection configuration is handled through `prisma.config.ts` rather than placing the database URL directly inside the Prisma datasource block.

## 🔐 Authentication

Authentication is implemented using **Auth.js / NextAuth**.

The authentication architecture separates configuration responsibilities:

```text
auth.config.ts
      │
      ├── Sign-in page configuration
      ├── Protected route authorization
      └── Proxy-compatible configuration
              │
              ↓
           auth.ts
              │
              ├── Credentials Provider
              ├── Prisma Adapter
              ├── Password verification
              ├── JWT sessions
              ├── JWT callback
              └── Session callback
```

The current authentication flow supports:

- User registration
- Email/password authentication
- Password hashing with `bcrypt-ts-edge`
- Credentials-based sign in
- Sign out
- JWT sessions
- User roles
- Protected `/account` routes
- Protected `/admin` routes
- Callback URL redirects
- Session user information
- Automatic handling of users with the default `NO_NAME` value

The NextAuth API handlers are exposed through:

```text
/api/auth/*
```

using the App Router catch-all route:

```text
app/api/auth/[...nextauth]/route.ts
```

## 🛒 Shopping Cart

The shopping cart is designed to support both:

- Guest users
- Authenticated users

The cart uses a `sessionCartId` to identify a guest cart before the user signs in.

The current cart architecture includes:

```text
Cart
├── items
├── itemsPrice
├── shippingPrice
├── taxPrice
├── totalPrice
├── sessionCartId
└── userId
```

Cart items contain:

```text
productId
name
slug
qty
image
price
```

The current development point is the **Add to Cart** functionality.

The initial Add to Cart flow is:

```text
Product Page
      ↓
AddToCart Component
      ↓
addItemToCart Server Action
      ↓
Success / Error Response
      ↓
Toast Notification
```

The cart database operations will be expanded as the cart implementation progresses.

## ✅ Validation

The project uses **Zod 4** for validation.

Validation schemas currently cover:

- Product creation
- Sign in
- Sign up
- Password confirmation
- Cart items
- Cart data

Types are inferred from Zod schemas where appropriate, reducing duplication between validation logic and TypeScript types.

Example:

```ts
export type CartItem = z.infer<typeof cartItemSchema>;
```

## 🎨 UI & Styling

The project uses:

- Tailwind CSS v4
- shadcn/ui
- Base UI
- Lucide React
- next-themes

The UI has been updated from older shadcn/Radix patterns to the current component APIs.

For example, older patterns such as:

```tsx
<Button asChild>
```

are not blindly copied from the original tutorial.

The project uses the current composition patterns provided by the installed shadcn/Base UI components.

The application also supports light and dark themes.

## 📱 Responsive Design

The application is designed to work across desktop and mobile layouts.

The header uses separate desktop and mobile navigation behavior, with the mobile menu implemented using the shadcn Sheet component.

The project also uses responsive Tailwind utilities throughout the product and authentication interfaces.

## 🧪 Development Philosophy

A major goal of this project is to modernize an older tutorial while preserving its intended learning progression.

The project follows these principles:

1. **Use current Next.js APIs**
2. **Use current React APIs**
3. **Avoid deprecated APIs**
4. **Use Server Components by default**
5. **Use Client Components only when necessary**
6. **Use Server Actions for server-side mutations**
7. **Keep database access on the server**
8. **Use strict TypeScript**
9. **Use Zod for server-side validation**
10. **Use the current shadcn/Base UI implementation**
11. **Do not blindly copy outdated tutorial code**
12. **Fix actual lint/type errors instead of disabling checks**
13. **Preserve working project architecture when adding new features**

## 📚 Development Progress

The project has progressed through the following major areas:

### Foundation

- Next.js project setup
- Tailwind CSS v4
- shadcn/ui setup
- Inter font
- Root layout
- Route groups
- Header and footer
- Theme switching
- Loading and not-found pages

### Products

- Product sample data
- Product TypeScript types
- Product listing
- Product cards
- Product pricing
- PostgreSQL product database
- Prisma Product model
- Product Server Actions
- Product detail pages
- Product image gallery

### Database

- PostgreSQL
- Prisma 7
- Prisma migrations
- Prisma generated client
- Database seeding
- Neon PostgreSQL
- Serverless Prisma configuration

### Authentication

- User models
- Authentication seed data
- Auth.js configuration
- Credentials provider
- NextAuth API route
- Sign in
- Sign out
- Sign up
- Callback URL handling
- Authentication error handling
- JWT customization
- Session customization
- Protected routes

### Cart

- Cart Prisma model
- Cart validation schemas
- Cart TypeScript types
- Add to Cart component
- Add to Cart Server Action foundation
- Toast feedback

## 🚧 Current Development Status

The project is currently at the **Cart implementation stage**.

The immediate focus is continuing from the Add to Cart component and progressively implementing the actual cart behavior, including server-side cart persistence and cart management.

Current flow:

```text
Products
   ↓
Authentication
   ↓
Cart Schema
   ↓
Add to Cart UI
   ↓
[ CURRENT STAGE ]
   ↓
Cart persistence & management
   ↓
Checkout
   ↓
Orders
```

## 🚀 Running the Project Locally

Install dependencies:

```bash
npm install
```

Generate the Prisma client:

```bash
npx prisma generate
```

Check the database migration status:

```bash
npx prisma migrate status
```

Seed the development database when required:

```bash
npx prisma db seed
```

Start the development server:

```bash
npm run dev
```

Then open:

```text
http://localhost:3000
```

## 🔒 Environment Variables

The project uses environment variables for application and database configuration.

Typical variables include:

```env
NEXT_PUBLIC_APP_NAME=
NEXT_PUBLIC_APP_DESCRIPTION=
NEXT_PUBLIC_SERVER_URL=

DATABASE_URL=

AUTH_SECRET=

LATEST_PRODUCTS_LIMIT=
```

The `.env` file should **never be committed to GitHub**.

## 📦 Deployment

The application is designed for deployment using:

- **Vercel** for the Next.js application
- **Neon** for PostgreSQL

Production environment variables should be configured through the hosting platform rather than committed to the repository.

## 📌 Project Status

This is an actively developed e-commerce project.

The application is being built incrementally while modernizing an older tutorial to current versions of the Next.js ecosystem.

**Current stack:** Next.js 16 + React 19 + TypeScript + Tailwind CSS v4 + shadcn/Base UI + Prisma 7 + PostgreSQL + Auth.js.

**Current milestone:** Shopping Cart implementation.

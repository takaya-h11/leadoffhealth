This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Environment Setup

Before running the application, you need to configure environment variables:

1. **Copy the example environment file:**
   ```bash
   cp .env.local.example .env.local
   ```

2. **Configure the following environment variables in `.env.local`:**

   - **Supabase Configuration** (Required)
     - `NEXT_PUBLIC_SUPABASE_URL`: Your Supabase project URL
       - Find this in your Supabase project settings → API → Project URL
     - `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Your Supabase anonymous key
       - Find this in your Supabase project settings → API → Project API keys (anon/public)

   - **Email Service Configuration** (Required for notifications)
     - `RESEND_API_KEY`: Your Resend API key for sending transactional emails
       - Sign up at [resend.com](https://resend.com)
       - Create an API key in your Resend dashboard
       - This is used for appointment notifications (request, approval, rejection, completion)

   - **Application URL** (Required for email links)
     - `NEXT_PUBLIC_APP_URL`: The base URL of your application
       - Development: `http://localhost:3000`
       - Production: Your deployed domain (e.g., `https://yourdomain.com`)

   - **Cron Job Secret** (Required for production)
     - `CRON_SECRET`: A random secret key for authenticating Vercel Cron Jobs
       - Generate a secure random string (e.g., use `openssl rand -base64 32`)
       - Used to verify that cron job requests are from Vercel
       - Must be set in Vercel's environment variables for production

3. **Example `.env.local` configuration:**
   ```bash
   # Supabase
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here

   # Resend (Email Service)
   RESEND_API_KEY=re_your_resend_api_key_here

   # Application URL (for email links)
   NEXT_PUBLIC_APP_URL=http://localhost:3000

   # Cron Job Secret (for Vercel Cron Jobs)
   CRON_SECRET=your_random_secret_key_here
   ```

## Getting Started

After setting up your environment variables, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
# leadoffhealth

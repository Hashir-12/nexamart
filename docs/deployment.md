# NexaMart Deployment Guide

## Prerequisites
- GitHub account
- Supabase account (free tier)
- Render account (free tier)
- Vercel account (free tier)
- OpenRouter API key (free)

## 1. Supabase Setup
1. Go to [Supabase](https://supabase.com) and create a new project.
2. Choose a database password, region, etc.
3. Once the project is created, navigate to the **SQL Editor** (left sidebar).
4. Click **New Query** and paste the contents of `supabase/schema.sql` into the editor.
5. Run the query. This will create the `carts` and `orders` tables.
6. Get your credentials:
   - Go to **Project Settings > API**.
   - Copy the **Project URL** (e.g., `https://xxxxx.supabase.co`).
   - Copy the **service_role** secret key (from the same page, under **API Keys**). **Keep this secret!**

## 2. Backend (Render)
1. Push your code to a GitHub repository.
2. On [Render](https://render.com), create a new **Web Service**.
3. Connect your GitHub repository.
4. Fill in the details:
   - **Name**: `nexamart-backend` (or any).
   - **Root Directory**: `backend` (important – Render will look for `requirements.txt` here).
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn main:app --host 0.0.0.0 --port $PORT`
5. In the **Environment Variables** section, add:
   - `OPENROUTER_API_KEY` – your OpenRouter key.
   - `OPENROUTER_MODEL` – e.g., `openrouter/free` (or leave default).
   - `SUPABASE_URL` – the Project URL from step 1.
   - `SUPABASE_SECRET_KEY` – the service_role key.
   - `CORS_ORIGINS` – initially `http://localhost:5173` (we'll update later).
6. Click **Create Web Service**. Render will deploy.
7. After deployment, note the URL (e.g., `https://nexamart-backend.onrender.com`).

## 3. Frontend (Vercel)
1. On [Vercel](https://vercel.com), click **Add New > Project**.
2. Import your GitHub repository.
3. Configure:
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
4. In the **Environment Variables** section, add:
   - `VITE_API_BASE_URL` = the Render URL from step 2 (e.g., `https://nexamart-backend.onrender.com`).
5. Click **Deploy**. Vercel will build and deploy.
6. After deployment, you’ll get a Vercel URL (e.g., `https://nexamart.vercel.app`).

## 4. Final CORS Update
- Go back to your Render dashboard, open the backend service, go to **Environment**.
- Update `CORS_ORIGINS` to include the Vercel URL, e.g.:
  `http://localhost:5173,https://nexamart.vercel.app`
- Save and **redeploy** the backend (Render will automatically restart).

## 5. Testing
- Open the Vercel frontend URL.
- Browse products, use the AI chat, add items to cart, checkout, and view orders.
- Open a second browser (or incognito) – each session should have its own cart and orders.

## Free Tier Limitations
- Render free services spin down after 15 minutes of inactivity – first request may take ~30–50 seconds to wake up.
- Supabase free tier has row limits, but your demo data will stay well within.
- Vercel frontend is static and fast.
- This is a demo, not a production service – occasional delays are expected.
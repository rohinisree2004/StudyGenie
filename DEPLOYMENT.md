# StudyGenie Deployment Guide 🚀

This guide explains how to deploy the StudyGenie platform with:
- **Backend API on Render** (`Node.js + Express`)
- **Frontend App on Vercel** (`React + Vite`)
- **Automated CI/CD via GitHub Actions** ([`.github/workflows/deploy.yml`](.github/workflows/deploy.yml))

---

## 1. Backend Deployment on Render

### Option A: Render Blueprint (Infrastructure as Code - Recommended)
1. Go to your [Render Dashboard](https://dashboard.render.com/).
2. Click **New +** $\to$ **Blueprint**.
3. Connect your repository: `https://github.com/rohinisree2004/StudyGenie.git`.
4. Render automatically detects [`render.yaml`](render.yaml) and configures:
   - **Root Directory**: `server`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Health Check Path**: `/api/health`
5. Supply the required environment variables:
   - `MONGO_URI`: Your MongoDB Atlas connection string.
   - `JWT_SECRET`: A secure random string (Render auto-generates if left blank).
   - `CLIENT_URL`: Your Vercel frontend URL (e.g. `https://your-studygenie.vercel.app`).
   - `GEMINI_API_KEY`: Your Google Gemini AI API key.
   - `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`: (Optional for file/avatar uploads).
6. Click **Apply**. Render will build and launch your backend service.
7. Note down your backend URL: e.g., `https://studygenie-backend.onrender.com`.

### Option B: Manual Web Service Setup
- **Type**: Web Service
- **Root Directory**: `server`
- **Environment**: `Node`
- **Build Command**: `npm install`
- **Start Command**: `npm start`
- **Health Check Path**: `/api/health`

---

## 2. Frontend Deployment on Vercel

1. Go to your [Vercel Dashboard](https://vercel.com/dashboard).
2. Click **Add New...** $\to$ **Project**.
3. Import `https://github.com/rohinisree2004/StudyGenie.git`.
4. In the Project Configuration:
   - **Framework Preset**: `Vite`
   - **Root Directory**: Click `Edit` and select **`client`** (crucial for monorepo structure).
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
5. Under **Environment Variables**, add:
   - `VITE_API_URL`: Your Render backend API URL (e.g. `https://studygenie-backend.onrender.com/api`)
6. Click **Deploy**.
7. Single Page App (SPA) routing is handled automatically by [`client/vercel.json`](client/vercel.json) to prevent 404 errors on page refresh.

---

## 3. GitHub Actions CI/CD Automation

The repository includes [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml) which automatically runs on every push to `main`:

1. **`ci-validate`**: Builds the frontend and tests backend dependencies and syntax.
2. **`deploy-backend-render`**: Triggers Render deployment via Deploy Hook.
3. **`deploy-frontend-vercel`**: Deploys the built client to Vercel production.

### Setting Up GitHub Repository Secrets (Optional for Webhooks)
In your GitHub repo: **Settings $\to$ Secrets and variables $\to$ Actions $\to$ New repository secret**:

| Secret Name | How to Get It |
| :--- | :--- |
| `RENDER_DEPLOY_HOOK_URL` | Render Dashboard $\to$ your Web Service $\to$ **Settings** $\to$ scroll to **Deploy Hook** $\to$ copy URL. |
| `VERCEL_TOKEN` | Vercel Dashboard $\to$ Account Settings $\to$ **Tokens** $\to$ Create Token. |
| `VERCEL_ORG_ID` | Run `vercel link` inside `client/` or check `.vercel/project.json` $\to$ `orgId`. |
| `VERCEL_PROJECT_ID` | Run `vercel link` inside `client/` or check `.vercel/project.json` $\to$ `projectId`. |

*(Note: If you have connected GitHub to Vercel and Render directly via their Git apps, both platforms also auto-deploy upon detecting git pushes to `main` without needing GitHub Actions tokens.)*

---

## 4. Post-Deployment Verification Checklist

- [ ] Open `https://your-backend.onrender.com/api/health` $\to$ Should return `{"success":true,"message":"StudyGenie API is live and operational 🚀"}`.
- [ ] Open your Vercel URL $\to$ Landing page loads with Soft Pastel styling.
- [ ] Test Login with demo accounts:
  - Admin: `admin@studygenie.com` / `Admin@StudyGenie2026!`
  - Teacher: `sarah.teacher@studygenie.com` / `TeacherPass123!`
  - Student: `alex.student@studygenie.com` / `StudentPass123!`
- [ ] Verify CORS: Ensure requests from your Vercel domain succeed without CORS errors.

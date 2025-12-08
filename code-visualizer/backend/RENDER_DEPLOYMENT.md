# Code Visualizer Backend - Render Deployment Guide

This guide explains how to deploy the `code-visualizer/backend` as a separate service on Render from the same repository.

## Overview

Since you have one Git repository containing multiple services:
- Main backend (Django) - already deployed
- Code Visualizer backend (FastAPI) - new service

You can deploy both from the same repo by specifying different **Root Directories** for each service.

## Method 1: Manual Service Creation (Recommended)

### Step 1: Create New Web Service on Render

1. Go to [Render Dashboard](https://dashboard.render.com)
2. Click **"New +"** → **"Web Service"**
3. Connect your repository (same repo as main backend)

### Step 2: Configure the Service

| Setting | Value |
|---------|-------|
| **Name** | `code-visualizer-api` (or your preferred name) |
| **Root Directory** | `code-visualizer/backend` |
| **Runtime** | Python 3 |
| **Build Command** | `pip install -r requirements.txt` |
| **Start Command** | `uvicorn server:app --host 0.0.0.0 --port $PORT` |

### Step 3: Add Environment Variables

Add these environment variables in the Render dashboard:

| Variable | Description |
|----------|-------------|
| `GEMINI_API_KEY` | Your Google Gemini API key |
| `LIVEKIT_URL` | Your LiveKit server URL (e.g., `wss://your-project.livekit.cloud`) |
| `LIVEKIT_API_KEY` | LiveKit API key |
| `LIVEKIT_API_SECRET` | LiveKit API secret |
| `CORS_ORIGINS` | Comma-separated allowed origins (e.g., `https://your-frontend.onrender.com,https://yourdomain.com`) |
| `PYTHON_VERSION` | `3.11.4` (optional, specifies Python version) |

### Step 4: Configure Health Check

Set the health check path to: `/api/health`

### Step 5: Deploy

Click **"Create Web Service"** and Render will:
1. Clone your repository
2. Navigate to `code-visualizer/backend` directory
3. Install dependencies
4. Start the FastAPI server

---

## Method 2: Using render.yaml Blueprint

If you prefer Infrastructure as Code, a `render.yaml` file is included in `code-visualizer/backend/`.

### Using the Blueprint

1. Go to [Render Dashboard](https://dashboard.render.com)
2. Click **"New +"** → **"Blueprint"**
3. Connect your repository
4. Render will detect the `render.yaml` and create services

**Note:** Move `render.yaml` to the repository root if using this method, or specify the path.

---

## Post-Deployment Configuration

### Update Frontend Environment Variables

After deployment, update your frontend production environment:

```env
# In frontend/.env.production
VITE_CODE_VISUALIZER_API_URL=https://code-visualizer-api.onrender.com/api
VITE_CODE_VISUALIZER_ROOT_URL=https://code-visualizer-api.onrender.com
```

Replace `code-visualizer-api.onrender.com` with your actual Render service URL.

### Update CORS_ORIGINS

Set `CORS_ORIGINS` on your Render service to include your frontend domain:

```
https://your-frontend-domain.com,https://your-frontend.onrender.com
```

---

## Troubleshooting

### Build Fails
- Check that `requirements.txt` exists in `code-visualizer/backend/`
- Verify Python version compatibility

### Health Check Fails
- Ensure `/api/health` endpoint is accessible
- Check logs for startup errors

### CORS Errors
- Verify `CORS_ORIGINS` includes your frontend URL
- Ensure no trailing slashes in origins

### LiveKit Connection Issues
- Verify all LiveKit environment variables are set
- Check LiveKit project is active

---

## File Structure

```
thestudent/
├── code-visualizer/
│   └── backend/
│       ├── server.py          # Main FastAPI application
│       ├── ai_teacher_agent.py # AI teacher with LiveKit
│       ├── requirements.txt   # Python dependencies
│       ├── render.yaml        # Render blueprint (optional)
│       ├── build.sh           # Build script
│       └── runtime.txt        # Python version
├── backend/                   # Main Django backend
└── frontend/                  # React frontend
```

---

## Service URLs

After deployment, your services will be:

| Service | URL |
|---------|-----|
| Main Backend | `https://your-main-backend.onrender.com` |
| Code Visualizer API | `https://code-visualizer-api.onrender.com` |
| Frontend | `https://your-frontend.onrender.com` |

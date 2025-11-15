#!/usr/bin/env bash
# Render build script for Django backend
# This runs during deployment on Render

set -o errexit  # Exit on error

echo "🔧 Installing Python dependencies..."
pip install --upgrade pip
pip install -r requirements.txt

# Install gunicorn for production server
pip install gunicorn

echo "📦 Collecting static files..."
cd backend
python manage.py collectstatic --no-input

echo "🗄️  Running database migrations..."
python manage.py migrate --no-input

echo "✅ Build completed successfully!"

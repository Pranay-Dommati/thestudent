#!/bin/bash

# Deployment script for Hostinger
echo "Preparing files for deployment..."

# Copy .htaccess to dist folder
cp .htaccess dist/

# Create a zip file of the dist folder
echo "Creating deployment package..."
cd dist && zip -r ../deploy.zip . && cd ..

echo "✅ Deployment package created: deploy.zip"
echo ""
echo "Instructions:"
echo "1. Log in to Hostinger control panel"
echo "2. Navigate to File Manager"
echo "3. Go to public_html directory"
echo "4. Upload deploy.zip"
echo "5. Extract the zip file"
echo "6. Delete the zip file"
echo ""
echo "Important: Make sure you have set up:"
echo "- Domain DNS settings"
echo "- SSL certificate"
echo "- Updated Google Adsense client ID in index.html"

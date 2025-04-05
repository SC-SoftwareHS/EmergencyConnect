#!/bin/bash

# Azure App Service Deployment Script for Emergency Alert System
# Usage: ./azure/webapp-deploy.sh <resource-group> <app-name>

# Exit on error
set -e

# Check for parameters
if [ $# -lt 2 ]; then
  echo "Usage: $0 <resource-group> <app-name>"
  echo "Example: $0 EmergencyAlertRG emergency-alert-app"
  exit 1
fi

RESOURCE_GROUP=$1
APP_NAME=$2

# Check if logged in to Azure
echo "Checking Azure login status..."
az account show &> /dev/null || { 
  echo "You are not logged into Azure. Please run 'az login' first."; 
  exit 1; 
}

# Display environment details
echo "Deploying to Azure App Service:"
echo "  Resource Group: $RESOURCE_GROUP"
echo "  App Name: $APP_NAME"

# Ensure our build directory exists and is clean
mkdir -p ./deploy
rm -rf ./deploy/*

# Prepare files for deployment
echo "Preparing files for deployment..."
rsync -av \
  --exclude 'node_modules' \
  --exclude '.git' \
  --exclude '.replit' \
  --exclude '.env' \
  --exclude '.gitignore' \
  --exclude 'deploy' \
  --exclude 'azure' \
  --exclude 'mobile-app' \
  --exclude 'replit.nix' \
  . ./deploy/

# Copy deployment files
cp .env.example ./deploy/.env

# Create a startup script for App Service
cat > ./deploy/startup.sh << 'EOL'
#!/bin/bash
# This script runs when the app service starts

# Install dependencies
echo "Installing dependencies..."
npm install

# Run database migrations if there are schema changes
echo "Running database migrations..."
node ./scripts/db-migrate.js

# Start the application
echo "Starting the application..."
node server.js
EOL

chmod +x ./deploy/startup.sh

# Create web.config for Azure App Service
cat > ./deploy/web.config << 'EOL'
<?xml version="1.0" encoding="utf-8"?>
<configuration>
  <system.webServer>
    <webSocket enabled="false" />
    <handlers>
      <add name="iisnode" path="server.js" verb="*" modules="iisnode"/>
    </handlers>
    <rewrite>
      <rules>
        <rule name="StaticContent">
          <action type="Rewrite" url="public{REQUEST_URI}"/>
        </rule>
        <rule name="DynamicContent">
          <conditions>
            <add input="{REQUEST_FILENAME}" matchType="IsFile" negate="True"/>
          </conditions>
          <action type="Rewrite" url="server.js"/>
        </rule>
      </rules>
    </rewrite>
    <security>
      <requestFiltering>
        <hiddenSegments>
          <remove segment="bin"/>
        </hiddenSegments>
      </requestFiltering>
    </security>
    <httpErrors existingResponse="PassThrough" />
  </system.webServer>
</configuration>
EOL

# Create .deployment file for Azure
cat > ./deploy/.deployment << 'EOL'
[config]
command = bash startup.sh
EOL

# Zip the deployment package
echo "Creating deployment package..."
cd ./deploy
zip -r ../deployment.zip .
cd ..

# Deploy to Azure App Service
echo "Deploying to Azure App Service..."
az webapp deployment source config-zip \
  --resource-group "$RESOURCE_GROUP" \
  --name "$APP_NAME" \
  --src deployment.zip

# Clean up
echo "Cleaning up temporary files..."
rm -rf ./deploy
rm -f deployment.zip

echo "Deployment complete!"
echo "Your application is now available at: https://$APP_NAME.azurewebsites.net"
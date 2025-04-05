#!/bin/bash

# Azure deployment script for Emergency Alert System
# This script helps deploy the application to Azure App Service

# Exit on error
set -e

echo "========================================"
echo "    Emergency Alert System Deployment"
echo "========================================"

# Check for Azure CLI
if ! command -v az &> /dev/null; then
    echo "Azure CLI is not installed. Please install it first."
    echo "Visit: https://docs.microsoft.com/en-us/cli/azure/install-azure-cli"
    exit 1
fi

# Check if logged in to Azure
echo "Checking Azure login status..."
az account show &> /dev/null || { 
    echo "You are not logged into Azure. Please run 'az login' first."; 
    exit 1; 
}

# Configuration - edit these variables
RESOURCE_GROUP="EmergencyAlertResourceGroup"
LOCATION="eastus"
APP_SERVICE_PLAN="EmergencyAlertServicePlan"
WEBAPP_NAME="emergency-alert-system"
SKU="B1"  # Basic tier, you can change to P1V2 for production

# Database configuration
DB_SERVER_NAME="emergency-alert-db"
DB_NAME="emergency_alert_system"
DB_USERNAME="dbadmin"
DB_PASSWORD="P@ssw0rd$123"  # You should change this or use a random generator

# Create Resource Group
echo "Creating Resource Group: $RESOURCE_GROUP in $LOCATION..."
az group create --name "$RESOURCE_GROUP" --location "$LOCATION"

# Create App Service Plan
echo "Creating App Service Plan: $APP_SERVICE_PLAN..."
az appservice plan create --name "$APP_SERVICE_PLAN" \
    --resource-group "$RESOURCE_GROUP" \
    --sku "$SKU" \
    --is-linux

# Create PostgreSQL server
echo "Creating PostgreSQL server: $DB_SERVER_NAME..."
az postgres server create \
    --resource-group "$RESOURCE_GROUP" \
    --name "$DB_SERVER_NAME" \
    --location "$LOCATION" \
    --admin-user "$DB_USERNAME" \
    --admin-password "$DB_PASSWORD" \
    --sku-name GP_Gen5_2 \
    --version 11

# Configure PostgreSQL server firewall to allow Azure services
echo "Configuring PostgreSQL server firewall..."
az postgres server firewall-rule create \
    --resource-group "$RESOURCE_GROUP" \
    --server-name "$DB_SERVER_NAME" \
    --name AllowAllAzureIPs \
    --start-ip-address 0.0.0.0 \
    --end-ip-address 0.0.0.0

# Create PostgreSQL database
echo "Creating PostgreSQL database: $DB_NAME..."
az postgres db create \
    --resource-group "$RESOURCE_GROUP" \
    --server-name "$DB_SERVER_NAME" \
    --name "$DB_NAME"

# Get PostgreSQL connection string
POSTGRES_CONNECTION_STRING=$(az postgres server show \
    --resource-group "$RESOURCE_GROUP" \
    --name "$DB_SERVER_NAME" \
    --query "fullyQualifiedDomainName" \
    --output tsv)
POSTGRES_CONNECTION_STRING="postgres://$DB_USERNAME:$DB_PASSWORD@$POSTGRES_CONNECTION_STRING:5432/$DB_NAME"

# Create Web App
echo "Creating Web App: $WEBAPP_NAME..."
az webapp create \
    --resource-group "$RESOURCE_GROUP" \
    --plan "$APP_SERVICE_PLAN" \
    --name "$WEBAPP_NAME" \
    --runtime "NODE|16-lts"

# Configure Web App settings
echo "Configuring Web App settings..."
az webapp config appsettings set \
    --resource-group "$RESOURCE_GROUP" \
    --name "$WEBAPP_NAME" \
    --settings \
    DATABASE_URL="$POSTGRES_CONNECTION_STRING" \
    NODE_ENV="production" \
    JWT_SECRET="$(openssl rand -hex 32)" \
    SENDGRID_API_KEY="" \
    SENDGRID_FROM_EMAIL="" \
    TWILIO_ACCOUNT_SID="" \
    TWILIO_AUTH_TOKEN="" \
    TWILIO_PHONE_NUMBER=""

# Display next steps
echo "========================================"
echo "Deployment completed successfully!"
echo "========================================"
echo ""
echo "Next steps:"
echo "1. Set your actual API keys in the App Service Configuration:"
echo "   - Visit: https://portal.azure.com > $WEBAPP_NAME > Configuration"
echo "   - Update: SENDGRID_API_KEY, TWILIO_ACCOUNT_SID, etc."
echo ""
echo "2. Deploy your code to the App Service using one of these methods:"
echo "   - GitHub Actions: Set up CI/CD from your GitHub repository"
echo "   - Local Git: Use the following command to set up local git deployment:"
echo "     az webapp deployment source config-local-git --name $WEBAPP_NAME --resource-group $RESOURCE_GROUP"
echo ""
echo "3. Run the database migrations after deployment:"
echo "   - Configure the deployment script to run npm run db:push"
echo ""
echo "PostgreSQL Server: $DB_SERVER_NAME.postgres.database.azure.com"
echo "Database Name: $DB_NAME"
echo "Web App URL: https://$WEBAPP_NAME.azurewebsites.net"
echo ""
echo "For more information, visit: https://docs.microsoft.com/en-us/azure/app-service/"

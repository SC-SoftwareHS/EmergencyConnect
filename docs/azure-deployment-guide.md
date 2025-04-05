# Azure Deployment Guide for Emergency Alert System

This guide provides step-by-step instructions for deploying the Emergency Alert System to Microsoft Azure.

## Prerequisites

- An Azure account with an active subscription
- Azure CLI installed locally (optional, for command-line deployment)
- Node.js and npm installed locally

## Deployment Options

There are several ways to deploy this application to Azure:

1. **Manual Deployment**: Upload your code directly to Azure App Service
2. **GitHub Actions**: Set up CI/CD from your GitHub repository
3. **ARM Template**: Deploy using the provided Azure Resource Manager templates
4. **Azure CLI**: Deploy using command-line tools

## Option 1: Manual Deployment

### Step 1: Create Azure Resources

1. Log in to the [Azure Portal](https://portal.azure.com)
2. Create a Resource Group
   - Click "Resource groups" > "Create"
   - Enter a name (e.g., "EmergencyAlertResourceGroup")
   - Select a region
   - Click "Review + create" > "Create"

3. Create an Azure Database for PostgreSQL
   - Click "Create a resource" > search for "Azure Database for PostgreSQL"
   - Select "Single server" > "Create"
   - Fill in the required details:
     - Server name: `emergency-alert-db`
     - Admin username: `dbadmin`
     - Password: (create a secure password)
     - Version: `11`
     - Compute + storage: Basic tier (for development) or General Purpose (for production)
   - Click "Review + create" > "Create"
   - After creation, go to the database resource
   - Under "Settings" > "Connection security":
     - Turn on "Allow access to Azure services"
     - Add your client IP address if needed
     - Click "Save"
   - Create a database by going to "Overview" and using the PostgreSQL connection string

4. Create an App Service Plan
   - Click "Create a resource" > search for "App Service Plan"
   - Fill in the required details:
     - Name: `emergency-alert-plan`
     - Operating System: Linux
     - Region: (same as your resource group)
     - Pricing Plan: B1 (Basic) for development, or P1V2 (Premium) for production
   - Click "Review + create" > "Create"

5. Create a Web App
   - Click "Create a resource" > search for "Web App"
   - Fill in the required details:
     - Name: `emergency-alert-system` (must be globally unique)
     - Runtime stack: Node 16 LTS
     - Operating System: Linux
     - Region: (same as your resource group)
     - App Service Plan: (select the one you created)
   - Click "Review + create" > "Create"

### Step 2: Configure Application Settings

1. Go to your Web App resource
2. Click "Settings" > "Configuration" > "Application settings" > "New application setting"
3. Add the following settings:

   ```
   DATABASE_URL=postgres://dbadmin:your-password@emergency-alert-db.postgres.database.azure.com:5432/emergencyalertsystem?sslmode=require
   PGUSER=dbadmin
   PGPASSWORD=your-password
   PGHOST=emergency-alert-db.postgres.database.azure.com
   PGPORT=5432
   PGDATABASE=emergencyalertsystem
   JWT_SECRET=your-strong-jwt-secret
   SENDGRID_API_KEY=your-sendgrid-api-key
   SENDGRID_FROM_EMAIL=your-verified-sender-email
   TWILIO_ACCOUNT_SID=your-twilio-account-sid
   TWILIO_AUTH_TOKEN=your-twilio-auth-token
   TWILIO_PHONE_NUMBER=your-twilio-phone-number
   NODE_ENV=production
   ```

4. Click "Save"

### Step 3: Deploy Your Code

1. In your Web App, go to "Deployment Center"
2. Choose your preferred deployment method:
   - **Local Git**: Set up Git deployment from your local machine
   - **GitHub**: Connect to your GitHub repository
   - **External Git**: Connect to another Git provider
   - **OneDrive/Dropbox**: Deploy from cloud storage
3. Follow the prompts to complete the setup

4. If using Local Git:
   - Copy the Git Clone URL
   - Add it as a remote to your local repository:
     ```
     git remote add azure <git-clone-url>
     ```
   - Push your code:
     ```
     git push azure main
     ```

5. After deployment, run database migrations:
   - Go to your Web App
   - Click "Development Tools" > "SSH"
   - In the SSH session, run:
     ```
     cd site/wwwroot
     node scripts/db-migrate.js
     ```

## Option 2: GitHub Actions CI/CD

1. Fork this repository to your GitHub account
2. In Azure, go to your Web App resource
3. Click "Deployment Center" > "GitHub" > "Authorize"
4. Select your repository, branch, and workflow
5. Click "Save"
6. Add your secrets to GitHub repository:
   - Go to your GitHub repository
   - Click "Settings" > "Secrets" > "New repository secret"
   - Add all the environment variables as secrets

## Option 3: ARM Template Deployment

We've provided Azure Resource Manager (ARM) templates in the `azure/templates` directory.

1. Log in to the [Azure Portal](https://portal.azure.com)
2. Click on "Create a resource"
3. Search for "Template deployment"
4. Click "Create" -> "Build your own template in the editor"
5. Click "Load file" and upload the `azure/templates/azuredeploy.json` file
6. Click "Save"
7. Fill in the required parameters, including:
   - Web App name
   - Database credentials
   - API keys for Twilio and SendGrid
8. Click "Review + create"
9. Click "Create" to deploy the resources

## Option 4: Azure CLI

You can use the script provided in `azure/webapp-deploy.sh`:

```bash
# Log in to Azure
az login

# Create a resource group
az group create --name EmergencyAlertResourceGroup --location eastus

# Run the deployment script
./azure/webapp-deploy.sh EmergencyAlertResourceGroup emergency-alert-system
```

## Post-Deployment Steps

After deploying the application, you should:

1. Verify the deployment was successful by visiting your web app URL
2. Run database migrations if not done automatically
3. Test all functionality, especially integrations with Twilio and SendGrid
4. Set up monitoring and alerts using Azure Monitor

## Troubleshooting

If you encounter issues:

1. Check application logs in your Web App
   - Go to your Web App
   - Click "Monitoring" > "Log stream"

2. Check database connectivity
   - Verify the connection string and credentials
   - Ensure the firewall allows Azure services

3. Check environment variables
   - Ensure all required environment variables are set correctly

## Security Considerations

1. Use Azure Key Vault for storing secrets
2. Enable HTTPS and enforce TLS
3. Set up authentication for your database
4. Configure network security rules
5. Enable Azure security features like Advanced Threat Protection

## Scaling

To handle increased load:

1. Scale up (vertical scaling):
   - Go to your App Service Plan
   - Click "Scale up (App Service plan)"
   - Select a higher tier

2. Scale out (horizontal scaling):
   - Go to your App Service Plan
   - Click "Scale out (App Service plan)"
   - Configure auto-scaling rules

## Monitoring

Set up monitoring for your application:

1. Enable Application Insights
   - Go to your Web App
   - Click "Settings" > "Application Insights" > "Turn on Application Insights"

2. Set up alerts
   - Go to your Web App
   - Click "Monitoring" > "Alerts" > "Create alert rule"

## Support

If you need further assistance, please open an issue in the GitHub repository or contact your Azure support team.

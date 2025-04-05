# Azure Resource Manager Templates for Emergency Alert System

This directory contains Azure Resource Manager (ARM) templates for deploying the Emergency Alert System to Azure.

## How to deploy

### Using Azure Portal

1. Log in to the [Azure Portal](https://portal.azure.com)
2. Click on "Create a resource"
3. Search for "Template deployment"
4. Click "Create" -> "Build your own template in the editor"
5. Click "Load file" and upload the `azuredeploy.json` file
6. Click "Save"
7. Fill in the required parameters
8. Click "Review + create"
9. Click "Create" to deploy the resources

### Using Azure CLI

```bash
# Log in to Azure
az login

# Create a resource group if needed
az group create --name EmergencyAlertResourceGroup --location eastus

# Deploy the template
az deployment group create \
  --resource-group EmergencyAlertResourceGroup \
  --template-file azuredeploy.json \
  --parameters @azuredeploy.parameters.json
```

## Parameters

| Parameter | Description |
|-----------|-------------|
| webAppName | Name of the web app |
| location | Location for all resources |
| sku | The pricing tier for the hosting plan |
| databaseServerName | Name of the PostgreSQL server |
| databaseName | Name of the PostgreSQL database |
| databaseAdminUsername | Administrator username for PostgreSQL server |
| databaseAdminPassword | Administrator password for PostgreSQL server |
| jwtSecret | Secret key for JWT authentication |
| sendgridApiKey | SendGrid API Key for email notifications |
| sendgridFromEmail | SendGrid verified sender email |
| twilioAccountSid | Twilio Account SID for SMS notifications |
| twilioAuthToken | Twilio Auth Token for SMS notifications |
| twilioPhoneNumber | Twilio Phone Number for SMS notifications |

## Security Note

In production, never store sensitive information like passwords or API keys in plaintext files. Consider using Azure Key Vault for storing secrets in a secure manner.

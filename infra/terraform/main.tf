terraform {
  required_version = ">= 1.5.0"
  required_providers {
    azurerm = {
      source  = "hashicorp/azurerm"
      version = "~> 3.90"
    }
  }
}

provider "azurerm" {
  features {}
}

# 1. Resource Group
resource "azurerm_resource_group" "rg" {
  name     = "rg-${var.app_name}-${var.environment}"
  location = var.location
  tags = {
    Environment = var.environment
    Project     = "MyGym"
    ManagedBy   = "Terraform"
  }
}

# 2. Azure Container Registry (Basic tier - cost-effective)
resource "azurerm_container_registry" "acr" {
  name                = "acr${var.app_name}${var.environment}"
  resource_group_name = azurerm_resource_group.rg.name
  location            = azurerm_resource_group.rg.location
  sku                 = "Basic"
  admin_enabled       = true
  tags                = azurerm_resource_group.rg.tags
}

# 3. Log Analytics Workspace (Required for Container Apps telemetry)
resource "azurerm_log_analytics_workspace" "logs" {
  name                = "log-${var.app_name}-${var.environment}"
  location            = azurerm_resource_group.rg.location
  resource_group_name = azurerm_resource_group.rg.name
  sku                 = "PerGB2018"
  retention_in_days   = 30
  tags                = azurerm_resource_group.rg.tags
}

# 4. Azure Container Apps Managed Environment
resource "azurerm_container_app_environment" "env" {
  name                       = "cae-${var.app_name}-${var.environment}"
  location                   = azurerm_resource_group.rg.location
  resource_group_name        = azurerm_resource_group.rg.name
  log_analytics_workspace_id = azurerm_log_analytics_workspace.logs.id
  tags                       = azurerm_resource_group.rg.tags
}

# 5. Azure Container App (Consumption Tier: Scales to 0 when idle)
resource "azurerm_container_app" "app" {
  name                         = "ca-${var.app_name}-${var.environment}"
  container_app_environment_id = azurerm_container_app_environment.env.id
  resource_group_name          = azurerm_resource_group.rg.name
  revision_mode                = "Single"
  tags                         = azurerm_resource_group.rg.tags

  # Image registry credentials
  registry {
    server               = azurerm_container_registry.acr.login_server
    username             = azurerm_container_registry.acr.admin_username
    password_secret_name = "acr-password"
  }

  secret {
    name  = "acr-password"
    value = azurerm_container_registry.acr.admin_password
  }

  secret {
    name  = "gemini-api-key"
    value = var.gemini_api_key
  }

  # Ingress configuration (Public HTTPS with automated SSL certificate)
  ingress {
    external_enabled = true
    target_port      = 3000
    traffic_weight {
      percentage      = 100
      latest_revision = true
    }
  }

  template {
    # Scale configuration: 0 to 2 replicas (0 when idle = free!)
    min_replicas = 0
    max_replicas = 2

    container {
      name   = "mygym-web"
      image  = var.container_image
      cpu    = 0.5
      memory = "1.0Gi"

      env {
        name  = "NODE_ENV"
        value = "production"
      }

      env {
        name        = "GEMINI_API_KEY"
        secret_name = "gemini-api-key"
      }

      # Health check probe
      liveness_probe {
        transport = "HTTP"
        port      = 3000
        path      = "/api/health"
        interval_seconds = 30
      }

      readiness_probe {
        transport = "HTTP"
        port      = 3000
        path      = "/api/health"
        interval_seconds = 10
      }
    }
  }
}

output "acr_login_server" {
  description = "The login server URL for Azure Container Registry"
  value       = azurerm_container_registry.acr.login_server
}

output "acr_admin_username" {
  description = "ACR admin username"
  value       = azurerm_container_registry.acr.admin_username
}

output "container_app_fqdn" {
  description = "Public HTTPS URL for the deployed MyGym application"
  value       = "https://${azurerm_container_app.app.ingress[0].fqdn}"
}

output "resource_group_name" {
  description = "Resource Group Name"
  value       = azurerm_resource_group.rg.name
}

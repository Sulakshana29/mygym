variable "location" {
  description = "Azure Region for resources"
  type        = string
  default     = "eastus"
}

variable "environment" {
  description = "Deployment environment name"
  type        = string
  default     = "prod"
}

variable "app_name" {
  description = "Application base name"
  type        = string
  default     = "mygym"
}

variable "container_image" {
  description = "Full Docker image URI (e.g. acrmygymprod.azurecr.io/mygym:latest or ghcr.io/...)"
  type        = string
  default     = "mcr.microsoft.com/azuredocs/aci-helloworld:latest"
}

variable "gemini_api_key" {
  description = "Gemini API key for AI split coaching and form assistant"
  type        = string
  sensitive   = true
  default     = ""
}

variable "aws_region" {
  description = "AWS region"
  type        = string
  default     = "ap-southeast-1"
}

variable "bucket_name" {
  description = "Name of the S3 bucket for frontend hosting"
  type        = string
}

variable "domain_name" {
  description = "Domain name for the frontend (optional)"
  type        = string
  default     = ""
}

# Local values for configurations
locals {
  # Common tags
  common_tags = {
    Project     = "my-tax-tracker"
    ManagedBy   = "terraform"
  }
  
  # Cache settings
  default_cache_ttl = 3600  # 1 hour
  static_cache_ttl  = 86400 # 24 hours
} 
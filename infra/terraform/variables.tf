variable "aws_region" {
  description = "AWS region"
  type        = string
  default     = "us-east-1"
}

variable "db_username" {
  description = "DB admin username"
  type        = string
  default     = "postgres"
}

variable "db_password" {
  description = "DB admin password"
  type        = string
  sensitive   = true
}

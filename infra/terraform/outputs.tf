output "alb_dns_name" {
  value = module.alb.alb_dns_name
}

output "ecr_repository_url" {
  value = module.ecr.ecr_repository_url
}

output "rds_endpoint" {
  value = module.rds.rds_endpoint
}

output "secrets_arn" {
  value = module.secrets.db_password_arn
}

output "db_password_arn" {
  value = aws_secretsmanager_secret.db_password.arn
}

resource "aws_ecr_repository" "api_repo" {
  name = "nodejs-api-demo"
  image_scanning_configuration {
    scan_on_push = true
  }
}

output "ecr_repository_url" {
  value = aws_ecr_repository.api_repo.repository_url
}

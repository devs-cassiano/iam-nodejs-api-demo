# Infraestrutura AWS para Node.js API Demo (Terraform)

Este diretório contém exemplos de código Terraform para provisionar a infraestrutura representada no diagrama:

- VPC, subnets públicas/privadas
- Application Load Balancer (ALB)
- ECS Fargate (serviço e task definition)
- RDS PostgreSQL
- ECR (repositório de container)
- Secrets Manager
- CloudWatch (logs via ECS)

## Estrutura dos módulos
- `network/`: VPC, subnets, internet gateway, route tables
- `ecr/`: Repositório de container
- `rds/`: Banco de dados PostgreSQL
- `ecs/`: Cluster, task definition e serviço Fargate
- `alb/`: Load Balancer, target group e listener
- `secrets/`: Secrets Manager para senha do banco

## Como usar
1. Configure suas credenciais AWS (ex: `aws configure`)
2. Ajuste variáveis em `variables.tf` conforme necessário
3. Execute:
   ```sh
   terraform init
   terraform plan
   terraform apply
   ```

## Observações
- Os módulos estão simplificados para demonstração. Para produção, adicione políticas de segurança, versionamento, backups, etc.
- Integração com CloudWatch está no log driver do ECS.
- O output mostrará endpoints e recursos criados.

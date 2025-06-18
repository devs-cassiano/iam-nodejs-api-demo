terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = ">= 5.0"
    }
  }
  required_version = ">= 1.5.0"
}

provider "aws" {
  region = var.aws_region
}

module "network" {
  source = "./network"
  aws_region = var.aws_region
}

module "ecr" {
  source = "./ecr"
}

module "rds" {
  source = "./rds"
  private_subnet_ids = module.network.private_subnet_ids
  db_username       = var.db_username
  db_password       = var.db_password
  db_sg_id          = module.network.rds_sg_id
}

module "alb" {
  source = "./alb"
  public_subnet_ids = module.network.public_subnet_ids
  vpc_id           = module.network.vpc_id
  alb_sg_id        = module.network.alb_sg_id
}

module "ecs" {
  source = "./ecs"
  ecs_execution_role_arn = module.ecs.ecs_execution_role_arn
  ecr_image_url          = module.ecr.ecr_repository_url
  db_password            = var.db_password
  aws_region             = var.aws_region
  private_subnet_id      = module.network.private_subnet_ids[0]
  ecs_sg_id              = module.network.ecs_sg_id
  alb_target_group_arn   = module.alb.api_tg_arn
  alb_listener_arn       = module.alb.api_listener_arn
}

module "secrets" {
  source = "./secrets"
  db_password = var.db_password
}

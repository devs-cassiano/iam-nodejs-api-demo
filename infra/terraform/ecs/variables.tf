variable "ecs_execution_role_arn" {
  type    = string
  default = null
}

variable "ecr_image_url" {
  type = string
}

variable "db_password" {
  type = string
}

variable "aws_region" {
  type = string
}

variable "private_subnet_id" {
  type    = string
  default = null
}

variable "public_subnet_id" {
  type = string
}

variable "ecs_sg_id" {
  type = string
}

variable "alb_target_group_arn" {
  type = string
}

variable "alb_listener_arn" {
  type = string
}

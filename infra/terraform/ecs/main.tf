resource "aws_ecs_cluster" "main" {
  name = "nodejs-api-demo-cluster"
}

resource "aws_ecs_task_definition" "api" {
  family                   = "nodejs-api-demo"
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  cpu                      = "256"
  memory                   = "512"
  execution_role_arn       = var.ecs_execution_role_arn
  container_definitions    = jsonencode([
    {
      name      = "api"
      image     = var.ecr_image_url
      portMappings = [{ containerPort = 3000 }]
      environment = [
        { name = "NODE_ENV", value = "production" },
        { name = "DB_PASSWORD", value = var.db_password }
      ]
      logConfiguration = {
        logDriver = "awslogs"
        options = {
          awslogs-group         = "/ecs/nodejs-api-demo"
          awslogs-region        = var.aws_region
          awslogs-stream-prefix = "ecs"
        }
      }
    }
  ])
}

resource "aws_ecs_service" "api" {
  name            = "nodejs-api-demo-service"
  cluster         = aws_ecs_cluster.main.id
  task_definition = aws_ecs_task_definition.api.arn
  launch_type     = "FARGATE"
  desired_count   = 1
  network_configuration {
    subnets          = [var.private_subnet_id]
    security_groups  = [var.ecs_sg_id]
    assign_public_ip = true
  }
  load_balancer {
    target_group_arn = var.alb_target_group_arn
    container_name   = "api"
    container_port   = 3000
  }
  depends_on = [var.alb_listener_arn]
}

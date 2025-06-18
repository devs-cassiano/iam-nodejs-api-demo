output "alb_dns_name" {
  value = aws_lb.api_alb.dns_name
}

output "api_tg_arn" {
  value = aws_lb_target_group.api_tg.arn
}

output "api_listener_arn" {
  value = aws_lb_listener.api_listener.arn
}

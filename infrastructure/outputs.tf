output "public_ip" {
  description = "Elastic IP address of the EC2 instance"
  value       = aws_eip.kyron_eip.public_ip
}

output "public_dns" {
  description = "Public DNS hostname of the EC2 instance"
  value       = aws_instance.kyron_app.public_dns
}

variable "region" {
  description = "AWS region to deploy into"
  type        = string
  default     = "us-east-1"
}

variable "instance_type" {
  description = "EC2 instance type"
  type        = string
  default     = "t2.micro"
}

variable "key_pair_name" {
  description = "Name of an existing EC2 key pair for SSH access"
  type        = string
  # No default — must be provided at plan/apply time.
  # Create one in the AWS console and pass via:
  #   terraform apply -var="key_pair_name=my-key"
}

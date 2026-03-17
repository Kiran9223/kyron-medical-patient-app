# ─────────────────────────────────────────────────────────────────────────────
# Kyron Medical — AWS EC2 Infrastructure
#
# NOTE: This is the production EC2 path. The live demo runs on
# Railway (backend) + Vercel (frontend) for zero-config deployment.
# Use this config when you're ready to move to a dedicated server.
#
# Usage:
#   terraform init
#   terraform apply -var="key_pair_name=<your-key>"
# ─────────────────────────────────────────────────────────────────────────────

terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

# ── Provider ──────────────────────────────────────────────────────────────────

provider "aws" {
  region = var.region
}

# ── Data: latest Ubuntu 22.04 LTS AMI ─────────────────────────────────────────
# We look this up dynamically so the config stays current without manual edits.

data "aws_ami" "ubuntu" {
  most_recent = true
  owners      = ["099720109477"] # Canonical

  filter {
    name   = "name"
    values = ["ubuntu/images/hvm-ssd/ubuntu-jammy-22.04-amd64-server-*"]
  }

  filter {
    name   = "virtualization-type"
    values = ["hvm"]
  }
}

# ── Security Group ─────────────────────────────────────────────────────────────
# Allows inbound SSH (22), HTTP (80), and HTTPS (443).
# All outbound traffic is permitted so the instance can pull packages / call APIs.

resource "aws_security_group" "kyron_sg" {
  name        = "kyron-medical-sg"
  description = "Allow SSH, HTTP, and HTTPS inbound"

  # SSH — restrict to your IP in production instead of 0.0.0.0/0
  ingress {
    description = "SSH"
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  # HTTP — Nginx listens here, redirects to HTTPS in production
  ingress {
    description = "HTTP"
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  # HTTPS — TLS termination by Nginx + Let's Encrypt
  ingress {
    description = "HTTPS"
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  # Allow all outbound (package installs, Anthropic / SendGrid / Vapi APIs)
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name    = "kyron-medical-sg"
    Project = "kyron-medical"
  }
}

# ── EC2 Instance ───────────────────────────────────────────────────────────────
# t2.micro is free-tier eligible. The user_data script bootstraps the full
# application stack on first boot (see user_data.sh).

resource "aws_instance" "kyron_app" {
  ami                    = data.aws_ami.ubuntu.id
  instance_type          = var.instance_type
  key_name               = var.key_pair_name
  vpc_security_group_ids = [aws_security_group.kyron_sg.id]

  # Bootstrap script runs once on first boot
  user_data = file("${path.module}/user_data.sh")

  # Root volume — 20 GB is plenty for this app
  root_block_device {
    volume_size = 20
    volume_type = "gp3"
  }

  tags = {
    Name    = "kyron-medical-app"
    Project = "kyron-medical"
  }
}

# ── Elastic IP ─────────────────────────────────────────────────────────────────
# A static IP that survives instance stop/start cycles.
# Without this, the public IP changes every reboot.

resource "aws_eip" "kyron_eip" {
  instance = aws_instance.kyron_app.id
  domain   = "vpc"

  tags = {
    Name    = "kyron-medical-eip"
    Project = "kyron-medical"
  }
}

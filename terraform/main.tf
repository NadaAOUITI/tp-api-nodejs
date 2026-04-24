# ============================================
# CONFIGURATION TERRAFORM
# ============================================
# Ce fichier décrit toute l'infrastructure :
# - Une clé SSH
# - Un pare-feu (Security Group)
# - Un serveur (instance EC2)
#
# Commandes :
#   terraform init    → Préparer le projet
#   terraform plan    → Voir ce qui va être créé
#   terraform apply   → Créer les ressources
#   terraform destroy → Tout supprimer
# ============================================

# ── Dire à Terraform qu'on utilise AWS ──
terraform {
  required_version = ">= 1.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = var.aws_region
  # Les identifiants AWS sont lus automatiquement depuis
  # les variables d'environnement (qu'on configurera à l'étape 1.6)
}

# ── Trouver automatiquement la bonne image de serveur ──
# Au lieu de chercher manuellement l'identifiant de l'image Amazon Linux,
# on demande à Terraform de trouver la plus récente pour nous.
data "aws_ami" "amazon_linux" {
  most_recent = true
  owners      = ["amazon"]

  filter {
    name   = "name"
    values = ["al2023-ami-*-x86_64"]
  }

  filter {
    name   = "virtualization-type"
    values = ["hvm"]
  }

  filter {
    name   = "state"
    values = ["available"]
  }
}

# ════════════════════════════════════════
# RESSOURCE 1 : La clé SSH
# ════════════════════════════════════════
# On envoie la clé PUBLIQUE à AWS.
# La clé PRIVÉE reste sur votre ordinateur.
resource "aws_key_pair" "tp_api_keypair" {
  key_name   = var.key_pair_name
  public_key = file(var.public_key_path)

  tags = {
    Name    = var.key_pair_name
    Project = "tp-api-nodejs"
  }
}

# ════════════════════════════════════════
# RESSOURCE 2 : Le pare-feu (Security Group)
# ════════════════════════════════════════
# Le pare-feu contrôle qui peut accéder au serveur et sur quels ports.
#
# Imaginez-le comme la porte d'entrée de votre serveur :
# - Port 22 (SSH)  : ouvert uniquement à VOTRE IP → vous seul pouvez entrer
# - Port 3000 (API): ouvert à tout le monde → tout le monde peut utiliser l'API
# - Port 80 (HTTP) : ouvert à tout le monde → accès web standard
resource "aws_security_group" "tp_api_sg" {
  name        = "tp-api-sg"
  description = "Pare-feu pour le TP API Node.js"

  # ── Qui peut ENTRER ? ──

  # Règle 1 : SSH — seulement depuis votre ordinateur
  ingress {
    description = "SSH depuis mon IP uniquement"
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = [var.my_ip]
    # ⚠️ On ne met PAS 0.0.0.0/0 ici !
    # Sinon n'importe qui pourrait tenter de se connecter en SSH.
  }

  # Règle 2 : L'API Node.js — accessible par tout le monde
  ingress {
    description = "API Node.js (port 3000)"
    from_port   = var.app_port
    to_port     = var.app_port
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]    # 0.0.0.0/0 = tout Internet
  }

  # Règle 3 : HTTP standard
  ingress {
    description = "HTTP"
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  # ── Qui peut SORTIR ? ──
  # Le serveur peut accéder à tout Internet (pour télécharger des paquets, etc.)
  egress {
    description = "Tout le trafic sortant"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"             # -1 = tous les protocoles
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name    = "tp-api-sg"
    Project = "tp-api-nodejs"
  }
}

# ════════════════════════════════════════
# RESSOURCE 3 : Le serveur (instance EC2)
# ════════════════════════════════════════
# C'est le serveur lui-même : une machine virtuelle dans le cloud.
# - t2.micro = 1 CPU, 1 Go de RAM (petit mais suffisant et gratuit)
resource "aws_instance" "tp_api" {
  ami                    = data.aws_ami.amazon_linux.id
  instance_type          = var.instance_type
  key_name               = aws_key_pair.tp_api_keypair.key_name
  vpc_security_group_ids = [aws_security_group.tp_api_sg.id]

  # Profil IAM pour AWS Academy
  iam_instance_profile = "LabInstanceProfile"

  tags = {
    Name        = var.instance_name
    Project     = "tp-api-nodejs"
    Environment = "production"
    ManagedBy   = "terraform"
  }

  # S'assurer que le pare-feu est créé AVANT le serveur
  depends_on = [aws_security_group.tp_api_sg]
}
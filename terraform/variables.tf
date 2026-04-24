# ============================================
# VARIABLES — Les paramètres de notre infrastructure
# ============================================

# Dans quelle région AWS créer le serveur ?
variable "aws_region" {
  description = "Région AWS"
  type        = string
  default     = "us-east-1"   # N. Virginia — recommandé pour AWS Academy
}

# Quelle taille de serveur ?
variable "instance_type" {
  description = "Taille du serveur EC2"
  type        = string
  default     = "t2.micro"    # Le plus petit (gratuit avec Free Tier)
}

# Quel nom donner au serveur ?
variable "instance_name" {
  description = "Nom du serveur"
  type        = string
  default     = "tp-api-nodejs"
}

# Nom de la clé SSH dans AWS
variable "key_pair_name" {
  description = "Nom de la clé SSH"
  type        = string
  default     = "tp-api-keypair"
}

# Où se trouve votre clé publique SSH ?
variable "public_key_path" {
  description = "Chemin vers la clé publique SSH"
  type        = string
  default     = "~/.ssh/tp-api-keypair.pub"
}

# Où se trouve votre clé privée SSH ?
variable "private_key_path" {
  description = "Chemin vers la clé privée SSH"
  type        = string
  default     = "~/.ssh/tp-api-keypair"
}

# Sur quel port tourne votre API ?
variable "app_port" {
  description = "Port de l'API Node.js"
  type        = number
  default     = 3000
}

# Votre adresse IP (pour autoriser SSH)
variable "my_ip" {
  description = "Votre IP publique (format : x.x.x.x/32)"
  type        = string
  # Pas de valeur par défaut — vous devez la fournir
}
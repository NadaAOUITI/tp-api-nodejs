# ============================================
# OUTPUTS — Infos affichées après terraform apply
# ============================================

output "instance_public_ip" {
  description = "Adresse IP publique du serveur"
  value       = aws_instance.tp_api.public_ip
}

output "api_url" {
  description = "URL de votre API"
  value       = "http://${aws_instance.tp_api.public_ip}:${var.app_port}"
}

output "ssh_command" {
  description = "Commande pour se connecter en SSH"
  value       = "ssh -i ${var.private_key_path} ec2-user@${aws_instance.tp_api.public_ip}"
}

output "instance_id" {
  description = "Identifiant du serveur EC2"
  value       = aws_instance.tp_api.id
}
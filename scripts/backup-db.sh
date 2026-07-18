#!/bin/sh
# Sauvegarde quotidienne de la base PostgreSQL de production.
#
# Usage sur le serveur (à planifier via cron, ex: tous les jours à 2h) :
#   0 2 * * * /chemin/vers/erp-universite/scripts/backup-db.sh
#
# Adapte DATABASE_URL, BACKUP_DIR et RETENTION_JOURS à ton environnement.
# Si tu utilises une base de données managée (Supabase, Neon, DigitalOcean
# Managed Database...), ce script n'est probablement pas nécessaire : ces
# fournisseurs incluent déjà des sauvegardes automatiques et la
# restauration à un point dans le temps — vérifie l'offre de ton
# fournisseur avant de dupliquer ce mécanisme.

set -e

BACKUP_DIR="${BACKUP_DIR:-/var/backups/erp-universite}"
RETENTION_JOURS="${RETENTION_JOURS:-30}"
DATE=$(date +%Y-%m-%d_%H%M%S)

mkdir -p "$BACKUP_DIR"

echo "Sauvegarde de la base en cours..."
pg_dump "$DATABASE_URL" | gzip > "$BACKUP_DIR/erp-universite_$DATE.sql.gz"

echo "Sauvegarde créée : $BACKUP_DIR/erp-universite_$DATE.sql.gz"

# Supprime les sauvegardes plus vieilles que RETENTION_JOURS
find "$BACKUP_DIR" -name "erp-universite_*.sql.gz" -mtime +"$RETENTION_JOURS" -delete

echo "Sauvegardes de plus de $RETENTION_JOURS jours supprimées."

#!/bin/sh
# Sao lưu PostgreSQL và file khách gửi. Chạy hằng ngày bằng cron, ví dụ: 0 2 * * * /đường/dẫn/scripts/backup.sh
set -e
cd "$(dirname "$0")/.."
set -a; . ./.env; set +a
STAMP=$(date +%F)
mkdir -p backups
docker compose -f docker-compose.prod.yml exec -T db pg_dump -U "$POSTGRES_USER" "$POSTGRES_DB" | gzip > "backups/db-$STAMP.sql.gz"
docker compose -f docker-compose.prod.yml exec -T backend tar -C /app -czf - private_media media > "backups/files-$STAMP.tar.gz"
find backups -name 'db-*.sql.gz' -mtime +14 -delete
find backups -name 'files-*.tar.gz' -mtime +14 -delete
echo "Đã sao lưu $STAMP. Hãy sao chép thư mục backups ra nơi lưu trữ ngoài máy chủ."

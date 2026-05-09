#!/usr/bin/env sh
set -eu

mkdir -p /srv/var

echo "Mounting R2 bucket via tigrisfs..."

/usr/local/bin/tigrisfs \
  --endpoint "${R2_ENDPOINT}" \
  -f "${BUCKET_NAME}" \
  /srv/var &

sleep 5

mkdir -p /srv/var/db
mkdir -p /srv/var/backup

echo "Starting Remark42..."

exec /srv/remark42
#!/usr/bin/env sh
set -eu

echo "Remark42 bootstrap: script entered"
echo "Remark42 bootstrap: checking required variables"

: "${SECRET:?SECRET is required}"
: "${REMARK_URL:?REMARK_URL is required}"
: "${SITE:?SITE is required}"
: "${R2_BUCKET_NAME:?R2_BUCKET_NAME is required}"
: "${R2_ENDPOINT:?R2_ENDPOINT is required}"
: "${AWS_ACCESS_KEY_ID:?AWS_ACCESS_KEY_ID is required}"
: "${AWS_SECRET_ACCESS_KEY:?AWS_SECRET_ACCESS_KEY is required}"

echo "Remark42 bootstrap: preparing R2 mount"

mkdir -p /mnt/r2

echo "Remark42 bootstrap: mounting R2 bucket ${R2_BUCKET_NAME} at /mnt/r2"

/usr/local/bin/tigrisfs \
  --endpoint "${R2_ENDPOINT}" \
  -f "${R2_BUCKET_NAME}" \
  /mnt/r2 &

TIGRISFS_PID="$!"

echo "Remark42 bootstrap: waiting for R2 mount"

mounted="false"
i=0
while [ "$i" -lt 20 ]; do
  if kill -0 "$TIGRISFS_PID" 2>/dev/null && mountpoint -q /mnt/r2; then
    mounted="true"
    break
  fi

  sleep 1
  i=$((i + 1))
done

if [ "$mounted" != "true" ]; then
  echo "Remark42 bootstrap: ERROR: R2 mount did not become ready"
  echo "Remark42 bootstrap: tigrisfs process status:"
  ps -ef | grep tigrisfs | grep -v grep || true
  exit 1
fi

echo "Remark42 bootstrap: R2 mount is ready"
ls -lah /mnt/r2 || true

echo "Remark42 bootstrap: creating Remark42 storage directories on R2"

mkdir -p /mnt/r2/remark42/db
mkdir -p /mnt/r2/remark42/backup

# Optional marker file so you can confirm R2 writes from the dashboard.
date -u +"%Y-%m-%dT%H:%M:%SZ" > /mnt/r2/remark42/container-last-started.txt || true

echo "Remark42 bootstrap: preparing frontend placeholders"

if [ -d /srv/web ]; then
  find /srv/web -type f \( -name "*.html" -o -name "*.js" -o -name "*.mjs" \) \
    -exec sed -i "s|{% REMARK_URL %}|${REMARK_URL}|g" {} \; || true

  single_site_id="${SITE%%,*}"
  sed -i "s|site_id:\"[^\"]*\"|site_id:\"${single_site_id}\"|g" /srv/web/*.html 2>/dev/null || true
fi

echo "Remark42 bootstrap: starting Remark42 server on port 8080"
echo "Remark42 bootstrap: REMARK_URL=${REMARK_URL}"
echo "Remark42 bootstrap: SITE=${SITE}"
echo "Remark42 bootstrap: STORE_BOLT_PATH=${STORE_BOLT_PATH:-/mnt/r2/remark42/db}"
echo "Remark42 bootstrap: BACKUP_PATH=${BACKUP_PATH:-/mnt/r2/remark42/backup}"

exec /srv/remark42 server
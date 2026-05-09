#!/usr/bin/env sh
set -eu

echo "Remark42 bootstrap: script entered"
echo "Remark42 bootstrap: checking required variables"

: "${SECRET:?SECRET is required}"
: "${REMARK_URL:?REMARK_URL is required}"
: "${SITE:?SITE is required}"

echo "Remark42 bootstrap: R2 env check"
echo "R2_BUCKET_NAME=${R2_BUCKET_NAME:-}"
echo "R2_ACCOUNT_ID=${R2_ACCOUNT_ID:-}"
echo "R2_ENDPOINT=${R2_ENDPOINT:-}"
echo "AWS_ACCESS_KEY_ID is set: $([ -n "${AWS_ACCESS_KEY_ID:-}" ] && echo yes || echo no)"
echo "AWS_SECRET_ACCESS_KEY is set: $([ -n "${AWS_SECRET_ACCESS_KEY:-}" ] && echo yes || echo no)"

mkdir -p /mnt/r2
mkdir -p /srv/var/db
mkdir -p /srv/var/backup

USE_R2="false"

if [ -n "${R2_BUCKET_NAME:-}" ] && [ -n "${R2_ENDPOINT:-}" ] && [ -n "${AWS_ACCESS_KEY_ID:-}" ] && [ -n "${AWS_SECRET_ACCESS_KEY:-}" ]; then
  echo "Remark42 bootstrap: attempting R2 mount"

  /usr/local/bin/tigrisfs \
    --endpoint "${R2_ENDPOINT}" \
    -f "${R2_BUCKET_NAME}" \
    /mnt/r2 &

  TIGRISFS_PID="$!"

  echo "Remark42 bootstrap: tigrisfs pid=${TIGRISFS_PID}"
  sleep 5

  echo "Remark42 bootstrap: tigrisfs process check"
  ps -ef | grep tigrisfs | grep -v grep || true

  echo "Remark42 bootstrap: /mnt/r2 listing attempt"
  ls -lah /mnt/r2 || true

  if kill -0 "$TIGRISFS_PID" 2>/dev/null; then
    echo "Remark42 bootstrap: tigrisfs is still running"
    mkdir -p /mnt/r2/remark42/db /mnt/r2/remark42/backup || true

    if date -u +"%Y-%m-%dT%H:%M:%SZ" > /mnt/r2/remark42/container-last-started.txt 2>/tmp/r2-write-error.log; then
      echo "Remark42 bootstrap: R2 write test succeeded"
      USE_R2="true"
    else
      echo "Remark42 bootstrap: R2 write test failed"
      cat /tmp/r2-write-error.log || true
    fi
  else
    echo "Remark42 bootstrap: tigrisfs exited early"
  fi
else
  echo "Remark42 bootstrap: R2 variables incomplete, skipping mount"
fi

if [ "$USE_R2" = "true" ]; then
  export STORE_BOLT_PATH="/mnt/r2/remark42/db"
  export BACKUP_PATH="/mnt/r2/remark42/backup"
  echo "Remark42 bootstrap: using R2-backed storage"
else
  export STORE_BOLT_PATH="/srv/var/db"
  export BACKUP_PATH="/srv/var/backup"
  echo "Remark42 bootstrap: using LOCAL fallback storage"
fi

echo "Remark42 bootstrap: preparing frontend placeholders"

if [ -d /srv/web ]; then
  find /srv/web -type f \( -name "*.html" -o -name "*.js" -o -name "*.mjs" \) \
    -exec sed -i "s|{% REMARK_URL %}|${REMARK_URL}|g" {} \; || true

  single_site_id="${SITE%%,*}"
  sed -i "s|site_id:\"[^\"]*\"|site_id:\"${single_site_id}\"|g" /srv/web/*.html 2>/dev/null || true
fi

echo "Remark42 bootstrap: starting Remark42 server on port 8080"
echo "Remark42 bootstrap: STORE_BOLT_PATH=${STORE_BOLT_PATH}"
echo "Remark42 bootstrap: BACKUP_PATH=${BACKUP_PATH}"

exec /srv/remark42 server
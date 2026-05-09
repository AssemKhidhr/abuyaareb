#!/usr/bin/env sh
set -eu

echo "Remark42 bootstrap: starting"

: "${SECRET:?SECRET is required}"
: "${REMARK_URL:?REMARK_URL is required}"
: "${SITE:?SITE is required}"
: "${BUCKET_NAME:?BUCKET_NAME is required}"
: "${R2_ENDPOINT:?R2_ENDPOINT is required}"
: "${AWS_ACCESS_KEY_ID:?AWS_ACCESS_KEY_ID is required}"
: "${AWS_SECRET_ACCESS_KEY:?AWS_SECRET_ACCESS_KEY is required}"

mkdir -p /srv/var

echo "Remark42 bootstrap: mounting R2 bucket via tigrisfs"

# Assumption: tigrisfs accepts: [options] <bucket> <mountpoint>.
# If your previous working tigrisfs syntax differs, keep your known-good mount
# command, but keep everything below it.
tigrisfs \
  --endpoint "${R2_ENDPOINT}" \
  "${BUCKET_NAME}" \
  /srv/var &

TIGRISFS_PID="$!"

# Give FUSE a short chance to mount.
sleep 5

mkdir -p /srv/var/db
mkdir -p /srv/var/backup

echo "Remark42 bootstrap: preparing frontend placeholders"

# Because this image normally uses docker-init.sh, but we override ENTRYPOINT,
# replicate the useful placeholder substitutions.
if [ -d /srv/web ]; then
  find /srv/web -type f \( -name "*.html" -o -name "*.js" -o -name "*.mjs" \) \
    -exec sed -i "s|{% REMARK_URL %}|${REMARK_URL}|g" {} \; || true

  single_site_id="${SITE%%,*}"
  sed -i "s|site_id:\"[^\"]*\"|site_id:\"${single_site_id}\"|g" /srv/web/*.html 2>/dev/null || true
fi

echo "Remark42 bootstrap: checking tigrisfs process"

if ! kill -0 "$TIGRISFS_PID" 2>/dev/null; then
  echo "Remark42 bootstrap: tigrisfs exited before Remark42 start"
  exit 1
fi

echo "Remark42 bootstrap: fixing storage ownership"
chown -R app:app /srv/var || true

echo "Remark42 bootstrap: starting Remark42 server on port 8080"

# This is the key part. The upstream Remark42 image starts the backend with
# the "server" subcommand, not just "/srv/remark42".
exec /srv/remark42 server
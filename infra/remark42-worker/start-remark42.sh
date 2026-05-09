#!/usr/bin/env sh
set -eu

echo "Remark42 bootstrap: starting NO-FUSE diagnostic mode"

: "${SECRET:?SECRET is required}"
: "${REMARK_URL:?REMARK_URL is required}"
: "${SITE:?SITE is required}"

mkdir -p /srv/var/db
mkdir -p /srv/var/backup

echo "Remark42 bootstrap: preparing frontend placeholders"

if [ -d /srv/web ]; then
  find /srv/web -type f \( -name "*.html" -o -name "*.js" -o -name "*.mjs" \) \
    -exec sed -i "s|{% REMARK_URL %}|${REMARK_URL}|g" {} \; || true

  single_site_id="${SITE%%,*}"
  sed -i "s|site_id:\"[^\"]*\"|site_id:\"${single_site_id}\"|g" /srv/web/*.html 2>/dev/null || true
fi

echo "Remark42 bootstrap: fixing storage ownership"
chown -R app:app /srv/var || true

echo "Remark42 bootstrap: starting Remark42 server on port 8080"

exec /srv/remark42 server
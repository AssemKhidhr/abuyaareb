#!/usr/bin/env sh
set -eu

echo "Remark42 bootstrap: script entered"
echo "Remark42 bootstrap: checking required variables"

: "${SECRET:?SECRET is required}"
: "${REMARK_URL:?REMARK_URL is required}"
: "${SITE:?SITE is required}"

echo "Remark42 bootstrap: creating storage directories"

mkdir -p /srv/var/db
mkdir -p /srv/var/backup

echo "Remark42 bootstrap: starting Remark42 server"
echo "Remark42 bootstrap: REMARK_URL=${REMARK_URL}"
echo "Remark42 bootstrap: SITE=${SITE}"

exec /srv/remark42 server
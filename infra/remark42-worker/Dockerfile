FROM ghcr.io/umputun/remark42:latest

USER root

RUN apk add --no-cache \
    --repository http://dl-cdn.alpinelinux.org/alpine/v3.20/main \
    ca-certificates fuse curl bash

RUN TIGRISFS_VERSION=1.2.1 && \
    ARCH=$(uname -m) && \
    if [ "$ARCH" = "x86_64" ]; then ARCH="amd64"; fi && \
    if [ "$ARCH" = "aarch64" ]; then ARCH="arm64"; fi && \
    curl -fL "https://github.com/tigrisdata/tigrisfs/releases/download/v${TIGRISFS_VERSION}/tigrisfs_${TIGRISFS_VERSION}_linux_${ARCH}.tar.gz" \
        -o /tmp/tigrisfs.tar.gz && \
    tar -xzf /tmp/tigrisfs.tar.gz -C /usr/local/bin/ && \
    rm /tmp/tigrisfs.tar.gz && \
    chmod +x /usr/local/bin/tigrisfs

COPY start-remark42.sh /start-remark42.sh
RUN chmod +x /start-remark42.sh

EXPOSE 8080

ENTRYPOINT ["/start-remark42.sh"]
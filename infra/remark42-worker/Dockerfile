FROM umputun/remark42:latest

USER root

# Remark42 image is Alpine-based, so use apk.
# fuse is required by tigrisfs. curl/tar are needed to install tigrisfs.
RUN apk add --no-cache \
    ca-certificates \
    curl \
    fuse \
    bash \
    procps \
    util-linux

# Install tigrisfs.
RUN ARCH="$(uname -m)" \
    && if [ "$ARCH" = "x86_64" ]; then ARCH="amd64"; fi \
    && if [ "$ARCH" = "aarch64" ]; then ARCH="arm64"; fi \
    && VERSION="$(curl -s https://api.github.com/repos/tigrisdata/tigrisfs/releases/latest | grep -o '"tag_name": "[^"]*' | cut -d'"' -f4)" \
    && echo "Installing tigrisfs ${VERSION} for ${ARCH}" \
    && curl -L "https://github.com/tigrisdata/tigrisfs/releases/download/${VERSION}/tigrisfs_${VERSION#v}_linux_${ARCH}.tar.gz" -o /tmp/tigrisfs.tar.gz \
    && tar -xzf /tmp/tigrisfs.tar.gz -C /usr/local/bin/ \
    && rm /tmp/tigrisfs.tar.gz \
    && chmod +x /usr/local/bin/tigrisfs \
    && /usr/local/bin/tigrisfs --version || true

COPY start-remark42.sh /start-remark42.sh

RUN sed -i 's/\r$//' /start-remark42.sh \
    && chmod +x /start-remark42.sh

EXPOSE 8080

ENTRYPOINT ["/bin/sh", "/start-remark42.sh"]
FROM umputun/remark42:latest

USER root

COPY start-remark42.sh /start-remark42.sh

RUN sed -i 's/\r$//' /start-remark42.sh \
    && chmod +x /start-remark42.sh

EXPOSE 8080

ENTRYPOINT ["/bin/sh", "/start-remark42.sh"]
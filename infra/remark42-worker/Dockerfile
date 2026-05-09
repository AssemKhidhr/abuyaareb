FROM umputun/remark42:latest

USER root

COPY start-remark42.sh /start-remark42.sh

# Important when editing on Windows:
# remove CRLF line endings and make the script executable.
RUN sed -i 's/\r$//' /start-remark42.sh \
    && chmod +x /start-remark42.sh

EXPOSE 8080

ENTRYPOINT ["/bin/sh", "/start-remark42.sh"]
FROM umputun/remark42:latest

USER root

# KEEP YOUR EXISTING tigrisfs INSTALL COMMANDS HERE.

COPY start-remark42.sh /start-remark42.sh
RUN chmod +x /start-remark42.sh

EXPOSE 8080

ENTRYPOINT ["/start-remark42.sh"]
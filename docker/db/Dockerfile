FROM postgres:11

RUN localedef -i fa_IR -c -f UTF-8 -A /usr/share/locale/locale.alias fa_IR.UTF-8
COPY 001_data.sql /docker-entrypoint-initdb.d/001_data.sql
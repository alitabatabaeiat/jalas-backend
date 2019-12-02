FROM postgres:11-alpine

RUN localedef -i fa_IR -c -f UTF-8 -A /usr/share/locale/locale.alias fa_IR.UTF-8
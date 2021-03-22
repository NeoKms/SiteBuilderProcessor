FROM node:latest
RUN apt-get update

#user
RUN echo 'root:3cqlrJZusKI' | chpasswd

#ssh
RUN apt-get install -y openssh-server && mkdir /var/run/sshd
RUN sed -ri 's/^#?PermitRootLogin\s+.*/PermitRootLogin yes/' /etc/ssh/sshd_config
RUN sed -ri 's/UsePAM yes/#UsePAM yes/g' /etc/ssh/sshd_config
RUN sed 's@session\s*required\s*pam_loginuid.so@session optional pam_loginuid.so@g' -i /etc/pam.d/sshd

#supervisord
RUN apt-get install -y supervisor && mkdir -p /var/log/supervisor
COPY supervisord.conf /etc/supervisor/conf.d/supervisord.conf

RUN apt-get install git
RUN cd /var \
    && git clone https://github.com/NeoKms/SiteBuilderProcessor.git \
    && cd /var/SiteBuilderProcessor \
	&& rm package-lock.json \
	&& npm install

#nodemon
RUN npm install pm2@latest -g

EXPOSE ${PORT} 23

CMD ["/usr/bin/supervisord"]

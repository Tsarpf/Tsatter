FROM dockerfile/nodejs
ADD environment /home/environment/
WORKDIR /home/environment
RUN npm install
EXPOSE 3000 3000
ADD postInstall /home/environment/
CMD bash -C 'start.sh'; bash;

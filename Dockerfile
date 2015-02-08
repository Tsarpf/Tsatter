FROM dockerfile/nodejs
ADD environment/package.json /home/environment/
WORKDIR /home/environment
RUN npm install
RUN npm install -g nodemon
EXPOSE 3000 3000
ADD environment/start.sh /home/environment/start.sh
CMD bash -C 'start.sh'; bash;

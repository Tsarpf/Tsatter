FROM dockerfile/nodejs
ADD environment/package.json /home/environment/
WORKDIR /home/environment
RUN npm install
RUN npm install -g nodemon && npm install -g bower
ADD environment/bower.json /home/environment/
RUN bower install
EXPOSE 3000 3000
ADD environment/start.sh /home/environment/start.sh
CMD bash -C 'start.sh'; bash;

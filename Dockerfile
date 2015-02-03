FROM dockerfile/nodejs
ADD environment /home/environment/
WORKDIR /home/environment
RUN npm install
EXPOSE 3000 3000

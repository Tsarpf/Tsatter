FROM dockerfile/nodejs
ADD environment/package.json /home/environment/
WORKDIR /home/environment
RUN npm install
EXPOSE 3000 3000
ADD environment /home/environment/
CMD bash -C 'start.sh'; bash;

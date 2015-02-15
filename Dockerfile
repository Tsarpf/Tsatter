FROM dockerfile/nodejs
RUN npm install -g nodemon && npm install -g bower
RUN useradd -ms /bin/bash nonroot
ADD environment/package.json /home/nonroot/environment/
WORKDIR /home/nonroot/environment
RUN npm install
RUN chown -R nonroot:nonroot /home/nonroot/
USER nonroot

# Set the HOME var, npm install gets angry if it can't write to the HOME dir, 
# which will be /root at this point
ENV HOME /home/nonroot/

ADD environment/bower.json /home/nonroot/environment/
RUN bower install
EXPOSE 3000 3000
ADD environment/start.sh /home/nonroot/environment/start.sh
CMD bash -C 'start.sh'; bash;

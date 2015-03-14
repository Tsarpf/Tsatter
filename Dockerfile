FROM dockerfile/nodejs

# Setup environment
ENV DEBIAN_FRONTEND noninteractive
RUN locale-gen en_US.UTF-8 fi_FI.UTF-8
ENV LANG en_US.UTF-8
ENV LANGUAGE en_US:en
ENV LC_ALL fi_FI.UTF-8

# Install apt-dependencies
RUN apt-get update && apt-get install -y screen openssh-server sudo

# Install npm-dependencies
RUN npm install -g nodemon bower forever
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
ENTRYPOINT ["./start.sh"]
CMD ["/bin/bash"]

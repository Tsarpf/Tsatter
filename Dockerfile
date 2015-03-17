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
RUN npm install -g nodemon bower forever grunt-cli
ADD environment/package.json /home/nonroot/environment/
WORKDIR /home/nonroot/environment
RUN npm install

# Add sudo permissions for nonroot
RUN echo "nonroot ALL=(ALL) NOPASSWD:ALL" >> /etc/sudoers

# Add nonroot user and change current user to it
RUN useradd -ms /bin/bash nonroot
RUN chown -R nonroot:nonroot /home/nonroot/
USER nonroot

# Set the HOME var, npm install gets angry if it can't write to the HOME dir, 
# which will be /root at this point
ENV HOME /home/nonroot/

# Add the public key to authorized_keys
RUN mkdir ~/.ssh
RUN echo "ssh-rsa AAAAB3NzaC1yc2EAAAABJQAAAIB2xUAZ+9Qn1a3Tix+6fDU6+bgRtq0FoEAzgre\
Gl2kTfbDWqBHH9TIvKLDdbVsBJT9eZVfMqy15z+p6qkJo4yKZrROwXd1HI7TJ03kbY2v6k1X/sFLhk\
DEZHiPGofQHGNFgwRS+q7ROXl14YSbhhbYf+W5x4H5WklRWALRE75A1dQ== rsa-key-20150313" >> ~/.ssh/authorized_keys
RUN chmod 700 ~/.ssh && chmod 600 ~/.ssh/authorized_keys

ADD environment/bower.json /home/nonroot/environment/
EXPOSE 3000 3000
ADD environment/start.sh /home/nonroot/environment/start.sh
ADD environment/Gruntfile.js /home/nonroot/environment/Gruntfile.js
ENTRYPOINT ["./start.sh"]
CMD ["/bin/bash"]

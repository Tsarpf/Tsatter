FROM ubuntu

RUN apt-get install -y python wget vim && \
cd /opt && \
wget http://nodejs.org/dist/v0.10.36/node-v0.10.36-linux-x64.tar.gz && \
tar -xzvf node* && \
rm -rf node*.tar.gz && \
mv node* node && \
cd /usr/local/bin && \
ln -s /opt/node/bin/* .


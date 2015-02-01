apt-get update
apt-get upgrade
apt-get install -y vim screen build-essential make
mkdir nodejs && cd nodejs && wget http://nodejs.org/dist/v0.10.36/node-v0.10.36-linux-x64.tar.gz
tar -xzvf node*
echo PATH=/home/vagrant/nodejs/node-v0.10.36-linux-x64/bin/:$PATH > /home/vagrant/.bashrc
source /home/vagrant/.bashrc
export PATH=/home/vagrant/nodejs/node-v0.10.36-linux-x64/bin/:$PATH
rm -rf node*.tar.gz
apt-key adv --keyserver hkp://keyserver.ubuntu.com:80 --recv 7F0CEB10
echo 'deb http://downloads-distro.mongodb.org/repo/ubuntu-upstart dist 10gen' | tee /etc/apt/sources.list.d/mongodb.list
apt-get update
apt-get install -y mongodb-org
mkdir /data/
mkdir /data/db
chown -R mongodb:mongodb /var/lib/mongodb/
chown -R mongodb:mongodb /data/db
service mongod restart
tail /var/log/mongodb/mongod.log
chown -R vagrant:vagrant /home/vagrant/nodejs
chown -R vagrant:vagrant /home/vagrant/.npm
cd /home/vagrant/environment/
npm config set registry https://registry.npmjs.org/
npm install -g bower
npm install -g mongodb
npm install



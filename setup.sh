#!/usr/bin/env bash

cd mongodb
./start.sh
cd ../

cd inspircd
./start.sh
cd ../

cd nodeapp
./run.sh
cd ../

cd nginx-container
./start.sh

#run the following to redirect the traffic coming to your port 80 to the port 3000 that tsatter owns
#iptables -t nat -I PREROUTING -p tcp --dport 80 -j REDIRECT --to-port 3000 

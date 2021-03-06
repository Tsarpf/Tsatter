#!/usr/bin/env bash

sudo docker rm -f nginx
sudo docker run -d -p 80:80 -v $(pwd)/sites-enabled:/etc/nginx/sites-enabled  -v $(pwd)/logs:/var/log/nginx -v $(pwd)/../nodeapp/environment/dist:/var/www/dist --name nginx --link nodeapp:nodeapp tsarpf/nginx

#docker run -d -p 80:80 -v <sites-enabled-dir>:/etc/nginx/sites-enabled -v <certs-dir>:/etc/nginx/certs -v <log-dir>:/var/log/nginx -v <html-dir>:/var/www/html dockerfile/nginx


#WIP
#docker tag $(sudo docker build -t tsatter/web:latest .) tsatter/web:latest
sudo docker rm -f nodeapp
sudo docker run --name nodeapp -p 3000:3000 -v $(pwd)/environment:/home/nonroot/environment/src --link db:db_1 --link inspirk:ircserver -t -i tsatter/web:latest

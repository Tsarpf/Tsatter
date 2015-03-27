echo "I need super user privileges because docker"
sudo docker build -t tsatter/web:latest .
sudo docker rm -f nodeapp 
sudo docker run --name nodeapp -v $(pwd)/environment:/home/nonroot/environment/src --link db:db_1 --link inspirk:ircserver -t -d tsatter/web

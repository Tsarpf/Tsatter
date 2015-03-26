echo "I need super user privileges because docker"
sudo docker build -t tsatter/web:latest .
sudo docker stop webapp
sudo docker rm -f webapp
sudo docker run -p 3000:3000 --name webapp -v $(pwd)/environment:/home/nonroot/environment/src --link db:db_1 --link inspirk:ircserver -t -d tsatter/web


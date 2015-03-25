docker build -t tsatter/web:latest .
docker stop webapp
docker rm -f webapp
docker run -p 3000:3000 --name webapp -v $(pwd)/environment:/home/nonroot/environment/src --link db:db_1 --link inspirk:ircserver -t -i tsatter/web


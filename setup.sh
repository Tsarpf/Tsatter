docker pull mongo
docker pull dockerfile/nodejs
docker build -t tsatter/web:latest .
docker stop db
docker rm db
docker run -p 27017:27017 -d --name db mongo
docker stop webapp
docker rm webapp
docker run -p 3000:3000 --name webapp --link db:db_1 -t -i tsatter/web

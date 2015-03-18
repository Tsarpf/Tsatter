sudo docker rm -f db
sudo docker run -v $(pwd)/data:/data/db --name db -p 27017:27017 -d dockerfile/mongodb

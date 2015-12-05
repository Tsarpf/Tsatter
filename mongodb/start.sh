sudo docker rm -f db
sudo docker run -v $(pwd)/data:/data/db --name db -d mongo

#sudo docker stop db
#sudo docker rm -f db
sudo docker run --name db -p 27017:27017 -d mongo

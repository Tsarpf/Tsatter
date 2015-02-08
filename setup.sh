docker stop inspirk
docker rm -f inspirk
cd inspircd
./start.sh
cd ../

docker pull mongo
docker pull dockerfile/nodejs
docker build -t tsatter/web:latest .
docker stop db
docker rm -f db
docker run --name db -p 27017:27017 -d mongo
docker stop webapp
docker rm -f webapp
docker run -p 3000:3000 --name webapp -v $(pwd)/environment:/home/environment/src --link db:db_1 -t -i tsatter/web 
#run the following to redirect the traffic coming to your port 80 to the port 3000 that tsatter owns
#iptables -t nat -I PREROUTING -p tcp --dport 80 -j REDIRECT --to-port 3000 

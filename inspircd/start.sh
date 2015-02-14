docker stop inspirk
docker rm -f inspirk
docker build -t tsatter/inspircd:latest .
docker run --name inspirk -d -p 6667:6667 -v $(pwd)/conf:/inspircd/conf tsatter/inspircd 

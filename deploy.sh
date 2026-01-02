#! /bin/bash

docker build . -t daily-wins
docker stop daily-wins
docker rm daily-wins
docker run -d --restart always --name daily-wins -p 3322:3000 -v $(pwd)/data:/app/data daily-wins
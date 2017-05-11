FROM node:boron

RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app

COPY package.json /usr/src/app/
RUN npm install

COPY . /usr/src/app

EXPOSE 8000
EXPOSE 8000/udp
EXPOSE 8080
EXPOSE 8081

CMD ["node", "index.js"]

# This is for swarm mode load balancing, since this thing doesn't work fast
# enough on a single xeon core with over 150 viewers.

# Set up 4 workers on one quad core machine:

# docker build -t dregu/visio .
# docker swarm init
# docker network create --driver overlay --subnet 10.0.9.0/24 visionet
# docker service create --replicas 4 --name visio --network visionet --publish 8081:8081 dregu/visio

# ws://127.0.0.1:8081/ should be balanced between the 4 workers.
# Now just duplicate the video stream to all the workers.
# Check raspi.sh for examples...

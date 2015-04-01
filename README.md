[![Stories in Ready](https://badge.waffle.io/Tsarpf/Tsatter.png?label=ready&title=Ready)](https://waffle.io/Tsarpf/Tsatter)
Tsatter
=======
[![Build Status](https://travis-ci.org/Tsarpf/Tsatter.svg?branch=master)](https://magnum.travis-ci.com/Tsarpf/Tsatter)

####Probably running the newest version here: http://tsatter.com
####You can also join the same channels by connecting to tsatter.com using your favorite IRC-client


#####Development/deployment works best on Linux. On Windows there's an outdated vagrant configuration that needs some work and on MacOSX it might need a bit of toying with super user privileges etc.

###How to deploy
- install docker
- run setup.sh
- tests should pass and the server should start, it should work at localhost:3000 almost immediately
- it might take a while for the node container to build the website. After that it should host the website using nginx at port 80

###How to develop
- install docker
- run setup.sh
- edit files in the environment folder, changes are automatically synced to the container and the server within the container restarted (using nodemon or forever)
- node serves non-minified assets to port 3000, use that to immediately see changes.
- Node also builds the whole website for nginx every time a change to the front-end code is made. The build will be served by nginx at port 80 as soon as it's ready. (Might 404 while building)

####About:
A  'next generation image board' that combines image boards and chatting (for example, IRC). Key technologies: MEAN-stack, Grunt, Bower, Nginx, Docker, Inspircd.

- Backend built on top of an IRC-server (Inspircd)
- Docker containers for everything to simplify the handling of the development and deployment environment.
- Automated tests for critical backend code.
- Layout and look using Twitter Bootstrap and Flat UI
- Grunt and Bower for library installs, code minification, wiring dependencies where they belong
- Nginx for performant serving of static files


This is the backend for Squadify. It provides all the routes necessary for the app to communicate with it. The API is built with express, and runs on a docker.


To start, run "npm install"

Create a .env file in the root folder, and add to it a JWT_SECRET. Make it whatever you want it to be (but don't be too obvious with it)

## Running the backend as dev

First seed the database. Create a postgres db with the name "squadify_db", and run "npm run seed"
(If it gives you some error, go the /scripts/seed.ts and change "synchronize" on line 31 to the opposite of whatever it is. If it gives you another error, try changing it and running again.)

Simply run "npm run start:dev" in the root folder. That should compile the dist/ folder and run the index.js in there.

To test, run "npm run test"

## Composing and running with Docker

You will need to install Docker and have it running in your computer. Go to https://www.docker.com/products/docker-desktop and download it there. Create an account, and log into it in your desktop app.

Next, run "docker build -t <your username>/<your-app-name> ." (replace these two as you please)

Running "docker images", you should see a list of your docker images, with <your username>/<your-app-name> being one of them.

Run the image. Running your image with -d runs the container in detached mode, leaving the container running in the background. The -p flag redirects a public port to a private port inside the container. Run the image you previously built: 
    "docker run -p 49160:8080 -d <your username>/<your-app-name>"
Add the --rm flag in order for the container to be deleted when you're done.

Print the output of your app:

// Get container ID
$ docker ps

// Print app output
$ docker logs <container id>

// Example
Running on http://localhost:8080

To stop this docker from running, run "docker stop <your username>/<your-app-name>"
To stop all dockers from running, run "docker stop $(docker ps -a -q)"

For more on removals, go to https://www.digitalocean.com/community/tutorials/how-to-remove-docker-images-containers-and-volumes
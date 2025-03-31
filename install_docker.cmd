if not exist "output" (
    mkdir output
)
if not exist "config" (
    mkdir config
)
docker login

docker build  --no-cache -t sat:latest .

docker run --name SAT --volume=config:/usr/src/app/config --volume=output:/usr/src/app/output --workdir=/usr/src/app/ -p 3000:3000 sat:latest
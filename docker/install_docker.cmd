if not exist "output" (
    mkdir output
)
if not exist "config" (
    mkdir config
)
docker login

docker build --no-cache -t sat:latest .

docker run --rm --name SAT -d -v "%cd%\config:/usr/src/app/config" -v "%cd%\output:/usr/src/app/output" -p 3000:3000 sat:latest
copy default.json config\default.json

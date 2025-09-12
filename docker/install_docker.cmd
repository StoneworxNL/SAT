if not exist "output" (
    mkdir output
)
if not exist "config" (
    mkdir config
)
docker login

docker build --build-arg CACHEBUST=$(date +%s) -t sat:latest .

docker rm -f SAT 2>nul

REM Ensure Docker Desktop has access to your local drive (C:)
REM This is a manual step in Docker Desktop settings, but we can check if the folders exist

docker run --restart unless-stopped --name SAT -d ^
    -v "%cd%\config:/usr/src/app/config" ^
    -v "%cd%\output:/usr/src/app/output" ^
    -v "C:\:/mnt/c" ^
    -p 3000:3000 sat:latest

copy default.json config\default.json

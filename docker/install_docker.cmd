REM Check for MendixProjects environment variable
set CACHEBUST=%DATE%_%TIME%
set CACHEBUST=%CACHEBUST: =%
set CACHEBUST=%CACHEBUST::=%
set CACHEBUST=%CACHEBUST:.=% 
IF "%MendixProjects%"=="" (
    echo ERROR: Environment variable MendixProjects is not set.
    exit /b 1
)

if not exist "output" (
    mkdir output
)
if not exist "config" (
    mkdir config
)
docker login

docker rm -f SAT 2>nul
REM docker image prune -a -f  
REM docker system prune -a -f
docker build --build-arg CACHEBUST=%CACHEBUST% -t sat:latest .

copy default.json config\default.json

REM Ensure Docker Desktop has access to your local drive (C:)
REM This is a manual step in Docker Desktop settings, but we can check if the folders exist
docker run --restart unless-stopped --name SAT -d ^
    -e "MendixProjects=/mendix/" ^
    -v "%cd%\config:/usr/src/app/config" ^
    -v "%cd%\output:/usr/src/output" ^
    -v "%MendixProjects%:/mendix" ^
    -p 3000:3000 sat:latest 


REM Check for MendixProjects environment variable
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

docker rm -f sat 2>nul
docker pull mnauta/sat:latest

copy default.json config\default.json

REM Ensure Docker Desktop has access to your local drive (C:)
REM This is a manual step in Docker Desktop settings, but we can check if the folders exist
docker run --restart unless-stopped --name sat -d ^
    -e "MendixProjects=/mendix/" ^
    -v "%cd%\config:/usr/src/app/config" ^
    -v "%cd%\output:/usr/src/output" ^
    -v "%MendixProjects%:/mendix" ^
    -p 3000:3000 mnauta/sat:latest 


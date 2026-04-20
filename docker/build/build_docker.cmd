echo OFF
REM Check for MendixProjects environment variable
set CACHEBUST=%DATE%_%TIME%
set CACHEBUST=%CACHEBUST: =%
set CACHEBUST=%CACHEBUST::=%
set CACHEBUST=%CACHEBUST:.=% 
IF "%MendixProjects%"=="" (
    echo ERROR: Environment variable MendixProjects is not set.
    exit /b 1
)

docker login

docker rm -f SAT 2>nul
docker build --build-arg CACHEBUST=%CACHEBUST% -t mnauta/sat:latest -t mnauta/sat:version%1% .

docker push mnauta/sat:latest
docker push mnauta/sat:version%1%


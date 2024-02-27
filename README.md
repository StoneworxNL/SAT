Tool for analysis and some documentation of Mendix apps.

**Implemented features**
* Generate Sequence Diagram from a (top) Microflow
* Analyse naming conventions of all MF's in an app

**Installation**
* requirements: Node & npm
* clone repo into working directory
* npm install to install all modules

**Usage**
node app.js [OPTIONS]...

Options:
  -v, --version                  output the version number
  
  -n, --nickname <nickname>      Nickname under which data is stored
  
  -d, --documentName <document>  Qualified name of document to analyse.
  
  -a, --appid <appid>            AppID of the mendix project
  
  -b, --branch <branch name>     Branch of the mendix project
  
  -m, --module <module name      Analysis module to use: SD=sequence Diagram, MQ=
  
  -e, --excludes [exclude....]   Modules to exclude from analysis
  
  -p, --prefixes [prefix...]     Prefixes to aggregate as one
  
  -h, --help                     display help for command

  **TODO**
  

  

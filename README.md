Tool for analysis and some documentation of Mendix apps.

**Implemented features**
* Generate Sequence Diagram from a (top) Microflow
* Analyse (some) coding quality rules on Microflows:
  
            NC1: format: [PRE]_[Entity(s)]_description
            NC2: Prefix must be allowed
            NC3: entity must exist
            NC4: entity must exist in same module
            IP1: Show Page action outside of ACT
            IP2: Close Page action outside of ACT
            CM1: Commit not on correct hierarchy level(ACT or one level down)
            PM1: Microflow of this type should contain permissions
            EH1: Java Action without custom error handling
            CX1: Too many actions in a single microflow
            CX2: Too complex microflow
            CX3: Too complex expression in Create/ Change Object
            CX4: Too complex expression in Create / Change Variable
            MC1: Missing caption for Exclusive split
  
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
  

  

Tool for analysis and some documentation of Mendix apps. 
Brought to you by Stoneworx

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
* update default.json to liking
** checksFolder: should point to folder that contains all checks that are specified in the 'checks' array 
** outputFolder: should point to folder where reports are written. Make sure that it exists

**Usage**
node app.js [OPTIONS]...

Options:
  -v, --version                  output the version number
  
  -n, --nickname <nickname>      Nickname under which data is stored
  
  -d, --documentName <document>  Qualified name of document to analyse.
  
  -a, --appid <appid>            AppID of the mendix project
  
  -b, --branch <branch name>     Branch of the mendix project, use the branch name, or 'trunk' for SVN main line, 'main' for git main line
  
  -m, --module <module name>      Analysis module to use: SD=sequence Diagram, MQ=
  
  -e, --excludes [exclude....]   Modules to exclude from analysis
  
  -p, --prefixes [prefix...]     Prefixes to aggregate as one
  
  -h, --help                     display help for command

  -c, --clear                    Clear working copy, create new

  **Examples**

  * Sequence Diagram: node app.js -m SD -n [NICKNAME] -d [MODULE].[MICROFLOW] -a [APPID] -b [BRANCH] -e [MODULE(S)] -p [PREFIXES]
  * Microflow Quality: node app.js -m MQ -n [NICKNAME] -a [APPID] -b [BRANCH] -e [MODULE(S)] -p [PREFIXES]

  **Accept notifications**
  To accept findings just add an annotation to the document (Page/documentation, Domain/documentation or Microflow/Annotation). It should follow this structure:
  @SAT-[CODE]: explanation. Where [CODE] is the finding code (like NC1)

  **Diff tool**
  To compare two results with each other, use node diff.js -1 [FIRST FILE] -2 [SECOND FILE] -o [OUTPUT FILE]

  

  

Tool for analysis and documentation of Mendix apps. 
Brought to you by Stoneworx

**Implemented features**
* Parse a local .mpr file or a working copy in the cloud
* Generate Sequence Diagram from a (top) Microflow
* Generate Authorisation Matrix from a project
* Analyse an extensible set of coding quality rules on a model:
  
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

**SAT-C**
Extract model information from a workingcopy in the mendix cloud.
***Usage***
```node SAT-C.js  [OPTIONS]...```

 -n RestoServe -a 7b100ded-837d-41c5-a239-838f8a91d59e -b %1 -e SSO %2 -o SATCModel
Options:
  -v, --version                  output the version number
  
  -a, --appid <appid>            AppID of the mendix project
  
  -b, --branch <branch name>     Branch of the mendix project, use the branch name, or 'trunk' for SVN main line, 'main' for git main line
   
  -o, --out <output file>   Filename of the result

  -h, --help                     display help for command

  -c, --clear                    Clear working copy, create new

***Example***
```node SAT-C.js -a [APPID] -b [BRANCH] -o [RESULTFILE]```

**SAT-L**
Extract model information from a local .mpr file.
***Usage***
```node SAT-L.js  [OPTIONS]...```

 -n RestoServe -a 7b100ded-837d-41c5-a239-838f8a91d59e -b %1 -e SSO %2 -o SATCModel
Options:
  -v, --version                  output the version number
  
  -m, --mpr <mpr file>    MPR file to parse

  -o, --out <output file>   Filename of the result

  -h, --help                     display help for command

***Example***
```node SAT-L.js -m [MPR FILE] -o [RESULTFILE]```

**SAT-AM**
Create Authorisation Matrix based on model information

***Usage***
```node SAT-AM.js  [OPTIONS]...```

 Options:
  -v, --version                  output the version number
  
  -i, --input <model file>    Model json file, result of SAT-C or SAT-L

  -o, --out <output file>   Output filename in csv format

  -h, --help                     display help for command

***Example***
```node SAT-AM.js -i [INPUT] -o [OUTPUT]```

**SAT-Q**
Applies coding quality rules to model information

***Usage***
```node SAT-Q.js  [OPTIONS]...```

 Options:
  -v, --version                  output the version number
  
  -i, --input <model file>    Model json file, result of SAT-C or SAT-L

  -o, --out <output file>   Output filename in csv format

  -h, --help                     display help for command

***Example***
```node SAT-Q.js -i [INPUT] -o [OUTPUT]```

***Accept notifications***
  To accept findings just add an annotation to the document (Page/documentation, Domain/documentation or Microflow/Annotation). It should follow this structure:
  @SAT-[CODE]: explanation. Where [CODE] is the finding code (like NC1)





  **Diff tool**
  To compare two results with each other, use node diff.js -1 [FIRST FILE] -2 [SECOND FILE] -o [OUTPUT FILE]

  

  

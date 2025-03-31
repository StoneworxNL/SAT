Tool for analysis and documentation of Mendix apps. 
Brought to you by Stoneworx

**Implemented features**

* Parse a local .mpr file or a working copy in the cloud
* Generate Sequence Diagram from a (top) Microflow
* Generate Authorisation Matrix from a project
* Analyse an extensible set of coding quality rules on a model:
  
				CM1: Commit not on correct hierarchy level(ACT or one level down)
				CM2: Commit not allowed in this type of microflow
				CM3: Create or Change object with commit  not on correct hierarchy level(ACT or one level down)
				CX1: Too many actions in a single microflow
				CX2: Too complex microflow
				CX3: Too complex expression in Create/ Change Object
				CX4: Too complex expression in Create / Change Variable
				CX5: Too complex expression in Exclusive Split
				DM1: Attribute name should not starts with the entity name
				DM2: Attribute name should not contain underscores '_'
				DM3: Entity name should be singular
				DU1: Demo users not allowed in production app
				EH1: Java Action without custom error handling
				GC1: Naming convention not as SUB_[ENTITYNAME]_GetOrCreate
				GC2: Get or Create does not return a (list of) object(s)
				GC3: Create or Change object with commit is not allowed in GetOrCreate
				GC4: Change object not allowed for existing object
				GC5: Get or Create does not return the existing object
				IP1: Show Page action outside of ACT
				IP2: Close Page action outside of ACT
				MS1: Menu microflows must be ACTs
				NC1: format: [PRE]_[Entity(s)]_description
				NC2: Prefix must be allowed
				NC3: Entity must exist 
				NC4: Entity must exist in same module
				ND1: Nesting of subs to deep
				ND2: Recursion detected
				OA1: Commit object not allowed in a microflow with this prefix
				OA2: Create or Change object not allowed in a microflow with this prefix
				PC1: Commit button on page in stead of micro/nanoflow
				PC2: Delete button on page in stead of micro/nanoflow
				PM1: Microflow of this type should contain permissions
				RC1: Rest calls only allowed within a CRS Microflow
				SM1: Missing caption for Exclusive split
				SM2: Useless merge action
				TD1: There should be no TODO annotations on the domain model
				TD2: There should be no TODO annotations in microflows
				TL1: Microflow may not call a Top level microflow

  
**Installation**

***Run as Docker container***

Easiest installation is via Docker.
* Prerequisite is a working Docker install ofc. 
* just download the install_docker.cmd in a folder of choice is enough (no need to clone the project)
* Run the command file install_docker.cmd will do the work (only first time)
* After installing the command: docker start SAT will do, or just start it from Docker Desktop
* Open: http://localhost:3000 in your browser


***Run as nodejs project***

* requirements: Node & npm node version: v20.19.0 (higher gives issues with sqlite module)
* clone repo into working directory
* npm install to install all modules
* update default.json to liking
** checksFolder: should point to folder that contains all checks that are specified in the 'checks' array 
** outputFolder: should point to folder where reports are written. Make sure that it exists

**SAT-C**

Extract model information from a workingcopy in the mendix cloud.

***Usage***

```node SAT-C.js  [OPTIONS]...```

 ptions:
  -v, --version                  output the version number
  
  -a, --appid <appid>            AppID of the mendix project
  
  -b, --branch <branch name>     Branch of the mendix project, use the branch name, or 'trunk' for SVN main line, 'main' for git main line
   
  -o, --out <output file>   Filename of the result

  -c, --clear                    Clear working copy, create new

  -h, --help                     display help for command


***Example***

```node SAT-C.js -a [APPID] -b [BRANCH] -o [RESULTFILE]```

**SAT-L**

Extract model information from a local .mpr file.

***Usage***

```node SAT-L.js  [OPTIONS]...```

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

**SAT-SD**

Generate Sequence Diagram (PlantUML format) for a microflow

***Usage***

```node SAT-SD.js  [OPTIONS]...```

 Options:
  -v, --version                  output the version number
  
  -i, --input <model file>    Model json file, result of SAT-C or SAT-L

  -o, --out <output file>   Output filename in csv format

  -m, --microflow <microflow> Name of the microflow to parse

  -e, --exclude <modules>  List of modules to exclude from analysis

  -p, --prefix <prefixes> List of prefixes to aggregate
 
  -h, --help                     display help for command

***Example***

```node SAT-SD.js -i [INPUT] -o [OUTPUT] -m [module.microflow] -e SSO -p VAL```


**SAT-Q**

Applies coding quality rules to model information

***Usage***

```node SAT-Q.js  [OPTIONS]...```

 Options:
  -v, --version                  output the version number
  
  -i, --input <model file>    Model json file, result of SAT-C or SAT-L

  -o, --out <output file>   Output filename in csv format
   
  -e, --exclude <modules>  List of modules to exclude from analysis
 
  -h, --help                     display help for command

***Example***

```node SAT-Q.js -i [INPUT] -o [OUTPUT]```

**SAT-D**

Diff tool to compare 2 ouput files of SAT-Q

***Usage***

```node SAT-D.js  [OPTIONS]...```

 Options:
  -v, --version                  output the version number
  
  -1, --first <SAT-L>    First SAT-L Output file (with folder to have autocomplete in windows)

  -2, --second <SAT-L>    Second SAT-L Output file (with folder to have autocomplete in windows)

  -o, --out <output file>   Output filename (prepended with folder in default.json)
 
  -h, --help                     display help for command

***Example***

```node SAT-Q.js -i [INPUT] -o [OUTPUT]```


***Accept notifications***

  To accept findings just add an annotation to the document (Page/documentation, Domain/documentation or Microflow/Annotation). It should follow this structure:
  @SAT-[CODE]: explanation. Where [CODE] is the finding code (like NC1)





**Diff tool**

To compare two results with each other, use node diff.js -1 [FIRST FILE] -2 [SECOND FILE] -o [OUTPUT FILE]
  

  

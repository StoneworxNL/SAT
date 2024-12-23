const c = require("config");
const { log } = require("console");
const fs = require("fs");


module.exports = class AnalysisSequenceDiagram {
    constructor(model, excludes, prefixes, outFileName) {
        this.model = model;
        this.excludes = excludes;
        this.prefixes = prefixes;
        this.outFileName = outFileName;
        this.calls = [];
        this.participants = {};
    }

    analyse = function (model, microflowName) {
        this.parseMicroflow(microflowName);
    }

    parseMicroflow(microflowName) {
        let microflow = this.findMicroflowByName(microflowName);
        let module = this.model.getModule(microflow.containerID);
        let qName = module.name + '.' + microflow.name;
        let [moduleName, microflowNm, prefix] = this.getNameParts(qName);
        let [participantCaller, isExcluded] = this.getParticipant(moduleName, microflow.name, prefix);
        this.participants[participantCaller] = isExcluded;
        microflow.subMicroflows.forEach(subMF => {
            let [moduleNameSUB, microflowSUB, prefixSUB] = this.getNameParts(subMF);
            let [participantCallee, isExcluded] = this.getParticipant(moduleNameSUB, microflowSUB, prefixSUB);
            this.participants[participantCallee] = isExcluded;
            if (isExcluded) {
                this.calls.push({ caller: participantCaller, callee: participantCallee, parameter: microflowSUB, isExcluded: true })
            } else this.calls.push({ caller: participantCaller, callee: participantCallee, isExcluded: false })
            if (!isExcluded) {
                this.parseMicroflow(subMF);
            }
        })
        microflow.actions.forEach(action => {
            if (action.type === 'Microflows$CommitAction') {
                this.participants['Çommit'] = isExcluded;
                this.calls.push({ caller: microflowNm, callee: "Commit", parameter: action.commitVariable })
            }
        })
    }

    getParticipant(moduleName, microflowName, prefix) {
        let excludeModule; let prefixAggregate;
        let participant = '';
        let isExcluded = false;
        if (this.excludes) {
            excludeModule = this.excludes.find(exclude => exclude === moduleName);
        }
        if (this.prefixes) {
            prefixAggregate = this.prefixes.find(prefixAgg => prefixAgg === prefix);
        }
        if (excludeModule) {
            participant = moduleName;
            isExcluded = true;
        } else if (prefixAggregate) {
            participant = prefixAggregate
            isExcluded = true;
        } else participant = microflowName;
        return [participant, isExcluded];
    }

    findMicroflowByName(microflowname) {
        return this.model.microflows.find(mf => {
            let module = this.model.getModule(mf.containerID)
            let qName = module.name + '.' + mf.name;
            return qName === microflowname;
        });
    }

    getNameParts(qualifiedMicroflowName) {
        if (qualifiedMicroflowName) {
            let [moduleName, microflowName] = qualifiedMicroflowName.split('.');
            let mfNameParts = microflowName.split('_');
            let mfPrefix = mfNameParts[0];
            return [moduleName, microflowName, mfPrefix];
        } else return [];
    }

    report(outFileName) {
        fs.writeFileSync(outFileName, `@startuml\n`, function (err) {
            if (err) throw err;
        });
        Object.keys(this.participants).forEach(participant => {
            if (!this.participants[participant]){
                fs.appendFileSync(outFileName, `participant "${participant}" as ${participant}\n`, function (err) {
                    if (err) throw err;
                });
            }
        })        
        Object.keys(this.participants).forEach(participant => {
            if (this.participants[participant]){
                fs.appendFileSync(outFileName, `participant "${participant}" as ${participant}\n`, function (err) {
                    if (err) throw err;
                });
            }
        })        
        this.calls.forEach(call => {
                let parm = '';
                if (call.parameter) {
                    parm = ": " + call.parameter;
                }
                fs.appendFileSync(outFileName, `${call.caller} --> "${call.callee}" ${parm}\n`, function (err) {
                    if (err) throw err;
                });
            })
        fs.appendFileSync(outFileName, `@enduml\n`, function (err) {
            if (err) throw err;
        });
    }

}


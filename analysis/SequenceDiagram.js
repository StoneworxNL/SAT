const fs = require("fs");
const AnalysisModule = require("./AnalysisModule");

module.exports = class AnalysisSequenceDiagram  extends AnalysisModule{
    constructor(excludes, prefixes, outFileName){
        super(excludes, prefixes, outFileName);
        this.microflows_by_name;
    }
    
    collect = function(model, branch, workingCopy, microflowname) {
        this.model = model;
        this.branch = branch;
        this.workingCopy = workingCopy;
        if (!this.model || !microflowname) {
            return
        }
        if (this.hierarchy[microflowname]) {
            return;
        }
        return new Promise((resolve, reject) => {
            this.microflows_by_name = this.findMicroflowByName(microflowname);
            if (this.microflows_by_name.length < 1) {
                reject(`Cannot find microflow for ${microflowname}`);
            }
            else {
                try {
                    const microflowinterface = this.microflows_by_name[0];
                    microflowinterface.load().then((microflow) => {
                        var nestedMicroflows = this.parseObjects(microflow);
                        resolve(nestedMicroflows);

                    });
                }
                catch (e) {
                    console.log(`Error occured: ${e}`);
                    reject(e);
                }
            }
        }).then((nestedMicroflows) => {
            if (nestedMicroflows.length > 0) {
                var promises = [];
                nestedMicroflows.forEach(nestedMicroflow => {
                    promises.push(this.collect(this.model, this.branch, this.workingCopy, nestedMicroflow));
                });
                return Promise.all(promises);
            } else return
        })
    }

    analyse = function(){
        console.log("ANALYSE");
        return new Promise((resolve, reject) => {
            resolve();
        })
    }

    report = function (nickname) {
        console.log("REPORT");
        console.log(JSON.stringify(this.hierarchy, null ,2));
        let participants = {};
        let calls = [];
        let excludeModule;
        let aggregatePrefixCaller;
        let outFileName = nickname + "_sd.txt";
        Object.keys(this.hierarchy).forEach((caller) => {
            let parts = caller.split('.');
            let moduleName = '';
            let callerMicroflow = caller;
            if (parts.length == 2) {
                moduleName = parts[0];
                callerMicroflow = parts[1];
            }
            if (this.excludes) {
                excludeModule = this.excludes.find((exclude) => { return exclude === moduleName });
            }
            if (this.prefixes) {
                aggregatePrefixCaller = this.prefixes.find((prefix) => { return callerMicroflow.startsWith(prefix) });
            }
            if (!excludeModule) {
                if (!aggregatePrefixCaller) {
                    participants[callerMicroflow] = {};
                    participants[callerMicroflow].qualifiedName = caller;
                }
                this.hierarchy[caller].forEach((callee) => {
                    if (callee.startsWith('Commit')) {
                        let commitVar = callee.replace("Commit ", "");
                        calls.push(`${callerMicroflow} ---> Commit: "${commitVar}"\n`);
                    } else {
                        let calleeParts = callee.split('.');
                        let calleeModuleName = ''
                        let calleeMicroflow = callee;
                        let excludeCallee;
                        let aggregatePrefixCallee;
                        if (calleeParts.length == 2) {
                            calleeModuleName = calleeParts[0];
                            calleeMicroflow = calleeParts[1];
                        }
                        if (this.excludes) {
                            excludeCallee = this.excludes.find((exclude) => { return exclude === calleeModuleName });
                        }
                        if (this.prefixes) {
                            aggregatePrefixCallee = this.prefixes.find((prefix) => { return calleeMicroflow.startsWith(prefix) });
                        }
                        if (aggregatePrefixCaller) { callerMicroflow = aggregatePrefixCaller }
                        if (aggregatePrefixCallee) { calleeModuleName = aggregatePrefixCallee }
                        if (!excludeCallee && !aggregatePrefixCallee) {
                            participants[calleeMicroflow] = {};
                            participants[calleeMicroflow].qualifiedName = callee;
                            calls.push(`${callerMicroflow} --> "${calleeMicroflow}"\n`);
                        } else {
                            calls.push(`${callerMicroflow} --> "${calleeModuleName}": "${calleeMicroflow}"\n`);
                        }
                    }
                })
            }

        })
        if (this.excludes && this.excludes.length > 0) {
            this.excludes.forEach((exclude) => {
                participants[exclude] = '';
            })
        }
        if (this.prefixes && this.prefixes.length > 0) {
            this.prefixes.forEach((prefix) => {
                participants[prefix] = '';
            })
        }
        participants['Commit'] = '';
        fs.writeFileSync(outFileName, `@startuml\n`, function (err) {
            if (err) throw err;
        });
        Object.keys(participants).forEach((participant) => {
            fs.appendFileSync(outFileName, `participant "${participant}" as ${participant}\n`, function (err) {
                if (err) throw err;
            });
        })
        console.log(calls);
        calls.forEach((call) => {
            fs.appendFileSync(outFileName, call, function (err) {
                if (err) throw err;
            });
        })
        fs.appendFileSync(outFileName, `@enduml\n`, function (err) {
            if (err) throw err;
        });

    }

    parseObjects= function(mf, parentMF) {
        var nestedMicroflows = [];
        let mfObjects = mf ? mf.objectCollection.objects : parentMF.objectCollection.objects;
        mfObjects.forEach((obj) => {
            let json = obj.toJSON();
            if (json['$Type'] === 'Microflows$LoopedActivity') {
                let nestedFromThis = this.parseObjects( obj, mf);
                nestedMicroflows.push(...nestedFromThis);
            }
            else if (json['$Type'] === 'Microflows$ActionActivity') {
                let action_type = json['action']['$Type'];
                if (action_type === 'Microflows$MicroflowCallAction') {
                    let mf_call = json['action']['microflowCall'];
                    if ((mf.name && mf.name != undefined) || (parentMF && parentMF.name != undefined)) {
                        this.updateHierarchy(mf.qualifiedName, mf_call.microflow, parentMF);
                    }
                    nestedMicroflows.push(mf_call['microflow']);
                }
                if (action_type === 'Microflows$CommitAction') {
                    this.updateHierarchy(mf.qualifiedName, `Commit ${json['action']['commitVariableName']}`);
                }
                if (action_type === 'Microflows$LoopedActivity') {
                }
            }
        });
        return nestedMicroflows;
    }

    updateHierarchy= function(caller, callee, parent) {
        if (!caller && parent && parent.name) { caller = parent.qualifiedName };
        let callees = this.hierarchy[caller];
        let hit;
        if (callees) {
            hit = callees.find((existingCallee) => {
                return existingCallee === callee;
            })
            if (!hit || hit.length == 0) { callees.push(callee); }
        } else {
            this.hierarchy[caller] = [callee];
        }
    }

}

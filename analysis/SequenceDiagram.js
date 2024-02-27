const fs = require("fs");
const AnalysisModule = require("./AnalysisModule");

module.exports = class AnalysisSequenceDiagram  extends AnalysisModule{
    constructor(excludes, prefixes, outFileName){
        super(excludes, prefixes, outFileName);
        this.microflows_by_name;
    }
    
    analyse = function(model, microflowname) {
        this.model = model;
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
                    promises.push(this.analyse(this.model, nestedMicroflow));
                });
                return Promise.all(promises);
            } else return
        })
    }

    report = function () {
        let participants = {};
        let calls = [];
        let excludeModule;
        let aggregatePrefixCaller;
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
                    participants[callerMicroflow] = this.complexity[caller];
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
                            participants[calleeMicroflow] = this.complexity[callee];
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
        fs.appendFileSync(this.outFileName, `@startuml\n`, function (err) {
            if (err) throw err;
        });
        Object.keys(participants).forEach((participant) => {
            let cmplx = this.complexity[participants[participant].qualifiedName];
            let score = '?';
            if (cmplx && cmplx.nodeCount) { score = cmplx.nodeCount }
            fs.appendFileSync(this.outFileName, `participant "${participant} [${score}]" as ${participant}\n`, function (err) {
                if (err) throw err;
            });
        })
        calls.forEach((call) => {
            fs.appendFileSync(this.outFileName, call, function (err) {
                if (err) throw err;
            });
        })
        fs.appendFileSync(this.outFileName, `@enduml\n`, function (err) {
            if (err) throw err;
        });

    }

    parseObjects= function(mf, parentMF) {
        var nestedMicroflows = [];
        this.analyseComplexity(mf, parentMF);
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

    analyseComplexity= function(mf, parentMF) {
        let count = mf.objectCollection.objects.length;
        let key = (mf && mf.qualifiedName) ? mf.qualifiedName : parentMF.qualifiedName;
        mf.objectCollection.objects.forEach((mfObject) => {
            let json = mfObject.toJSON();
            if (json['$Type'] === 'Microflows$LoopedActivity') {
                count += 3 //loops complexity
            }
            if (json['$Type'] === 'Microflows$ExclusiveSplit') {
                count += 5 //decision complexity
            }
        });
        let mfComplexity = this.complexity[key];
        if (mfComplexity && !(mf && mf.qualifiedName)) { // first hit always via mf, count only once
            mfComplexity["nodeCount"] += count;
        } else {
            this.complexity[key] = { "nodeCount": count }
        }
    }
}


module.exports = class AnalysisModule {
    constructor(appID,excludes, prefixes, outFileName) {
        this.model;
        this.branch;
        this.hierarchy = {};
        this.reports = [];
        this.complexity = {};
        this.appID = appID;
        this.excludes = excludes;
        this.prefixes = prefixes;
    }

    findAllMicroflows(){
        return this.model.allMicroflows();
    }
    findAllRules(){
        return this.model.allRules();
    }

    findMicroflowByName(microflowname) {
        return this.model.allMicroflows().filter((mf) => {
            if (mf.name === microflowname || mf.qualifiedName === microflowname) {
                microflowname = mf.qualifiedName;
            }
            return (mf.name === microflowname || mf.qualifiedName === microflowname);
        });
    }

    getModuleName(document){
        let qualifiedName = document.qualifiedName;
        let parts = qualifiedName.split('.');
        if (parts.length = 2){
            return parts[0];
        } else return '';

    }

    getDocumentName(document){
        let qualifiedName = document.qualifiedName;
        let parts = qualifiedName.split('.');
        if (parts.length = 2){
            return parts[1];
        } else return '';

    }    

    nameParts (qualifiedMicroflowName){
        if (qualifiedMicroflowName){
            let [moduleName, microflowName] = qualifiedMicroflowName.split('.');
            let mfNameParts = microflowName.split('_');
            let mfPrefix = mfNameParts[0];
            return [moduleName, microflowName, mfPrefix];
        }  else return [];
    }

    filterMarketplace(){
        if (!this.excludes) {this.excludes = []};
        this.model.allModules()
        .filter(module => module.fromAppStore === true)
        .forEach(module => {
            if (this.excludes){
                this.excludes.push(module.name);
            }
        });
    }
}
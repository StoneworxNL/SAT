
module.exports = class AnalysisModule {
    constructor(appID,excludes, prefixes) {
        this.model;
        this.branch;
        this.hierarchy = {};
        this.reports = [];
        this.complexity = {};
        this.appID = appID;
        this.excludes = excludes;
        this.prefixes = prefixes;
        this.reportFile = '';
    }

    getDateTimeString(){
        let now = new  Date();
        let year = now.getFullYear();
        let month = ('00'+(now.getMonth()+1).toString()).slice(-2);
        let day = ('00'+now.getDate().toString()).slice(-2);
        let hour = ('00'+ now.getHours().toString()).slice(-2);
        let minute = ('00'+now.getMinutes().toString()).slice(-2);
        return `${year}${month}${day}_${hour}${minute}`;
    }

    findAllMicroflows(){
        return this.model.allMicroflows();
    }
    findAllRules(){
        return this.model.allRules();
    }
    findAllDomainModels(){
        return this.model.allDomainModels();
    }
    findAllPages(){
        return this.model.allPages();
    }

    findMicroflowByName(microflowname) {
        return this.model.allMicroflows().filter((mf) => {
            if (mf.name === microflowname || mf.qualifiedName === microflowname) {
                microflowname = mf.qualifiedName;
            }
            return (mf.name === microflowname || mf.qualifiedName === microflowname);
        });
    }

    logObject(object){
        console.log(JSON.stringify(object, null, 2));
    }

    getModuleName(document){
        let qualifiedName = document.qualifiedName;
        if (document.structureTypeName ==='DomainModels$DomainModel'){
            return document.container.name;
        } else {
            let parts = qualifiedName.split('.');
            if (parts.length = 2){
                return parts[0];
            } else return '';
        }
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
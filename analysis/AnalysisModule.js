
module.exports = class AnalysisModule {
    constructor(excludes, prefixes, outFileName) {
        this.model;
        this.hierarchy = {};
        this.complexity = {};
        this.excludes = excludes;
        this.prefixes = prefixes;
        this.outFileName = outFileName;
    }

    findAllMicroflows(){
        return this.model.allMicroflows();
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


    filterMarketplace(){
        this.model.allModules()
        .filter(module => module.fromAppStore === true)
        .forEach(module => this.excludes.push(module.name));
    }
}
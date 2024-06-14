const MicroflowQuality  = require("../analysis/MicroflowQuality");

module.exports = class CheckModule {    
    constructor(options) {
        this.options = options || {};
        this.errorCodes = {};
        this.moduleName = '';
        this.microflowName = '';
        this.mfPrefix = '';
        this.level = 'microflow';
    }

    parseMFName = function (qualifiedMicroflowName) {
        if (qualifiedMicroflowName) {
            let [moduleName, microflowName] = qualifiedMicroflowName.split('.');
            let mfNameParts = microflowName.split('_');
            let mfPrefix = mfNameParts[0];
            this.moduleName = moduleName;
            this.microflowName = microflowName;
            this.mfPrefix = mfPrefix;
        }
    }

    getErrorCodes = function() {
        return this.errorCodes;
    }

    addErrors = function(errors, code, ignoreList, comment){
        let isIgnore = ignoreList.find(ignore => code === ignore);
        if (!isIgnore || isIgnore.length == 0 ){
            errors.push({'code': code, 'comment': comment});
        }
    }
    
}
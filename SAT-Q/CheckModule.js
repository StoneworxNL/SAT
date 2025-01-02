class CheckModule {    
    constructor(options) {
        this.options = options || {};
        this.errorCodes = {};
        this.moduleName = '';
        this.module;
        this.microflowName = '';
        this.mfPrefix = '';
        this.level = 'microflow';
        this.allowedPrefixes = [];
        this.exceptionPrefixes = [];
        this.errors = [];
    }

    setup = function(model, document){
        if (this.options){
            this.allowedPrefixes = this.options.allowedPrefixes;
            this.exceptionPrefixes = this.options.exceptionPrefixes;
        }
        this.parseMFName(document.name);
        this.module = model.getModule(document.containerID);
        this.moduleName = module.name;
        this.errors = [];
    }

    parseMFName = function (microflowName) {
        if (microflowName) {
            let mfNameParts = microflowName.split('_');
            let mfPrefix = mfNameParts[0];
            this.microflowName = microflowName;
            this.mfPrefix = mfPrefix;
        }
    }

    getErrorCodes = function() {
        return this.errorCodes;
    }

    addErrors = function(code, ignoreList, comment){
        let isIgnore = ignoreList.find(ignore => code === ignore);
        if (!isIgnore || isIgnore.length == 0 ){
            this.errors.push({'code': code, 'comment': comment});
        }
    }
    
}

module.exports = CheckModule;
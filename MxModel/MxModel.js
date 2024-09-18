const Module = require("./Module");
const Entity = require("./Entity");
const Microflow = require("./Microflow");

class MxModel{
    constructor() {
        this.security = {},
        this.modules = [];
        this.entities = [];
        this.microflows = [];
    }

    parseSecurity(doc) {
        this.security = { 'enableDemoUsers': doc['EnableDemoUsers'] };
    }

    parseModule(doc){
        this.modules.push(Module.parse(doc));
    };

    parseDomain(doc, container){
        this.entities.push(...Entity.parse(doc, container))
    }
    
    parseMicroflow(doc, container){
        this.microflows.push(Microflow.parse(doc, container))
    }


}

module.exports = MxModel;
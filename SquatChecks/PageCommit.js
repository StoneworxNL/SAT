const CheckModule = require("./CheckModule");

module.exports = class PageCommit extends CheckModule {
    constructor(options) {
        super(options);
        this.errorCodes = {
            "PC1": "Commit button on page in stead of micro/nanoflow",
            "PC2": "Delete button on page in stead of micro/nanoflow"
        };
        this.level = 'page';
    }

    check = function (model, page) {
        this.setup(model, page);  
        let ignoreRuleAnnotations = page.getIgnoreRuleAnnotations(page);
        page.buttons.forEach(button => {
            if (button.type ==='Forms$SaveChangesClientAction'){
                this.addErrors("PC1", ignoreRuleAnnotations);   
            } else if (button.type ==='Forms$DeleteClientAction'){
                this.addErrors("PC2", ignoreRuleAnnotations);   
            }          
        });    
        return this.errors;
    }
}
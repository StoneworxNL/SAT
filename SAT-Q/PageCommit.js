const CheckModule = require("./CheckModule");

module.exports = class PageCommit extends CheckModule {
    constructor(options) {
        super(options);
        this.errorCodes = {
            "PC1": "Commit button on page in stead of micro/nanoflow",
            "PC2": "Delete button on page in stead of micro/nanoflow",
            "CS1": "Page contains CSS"
        };
        this.level = 'page';
    }

    check = function (model, page) {
        this.setup(model, page);  
        let ignoreRuleAnnotations = page.getIgnoreRuleAnnotations(page);
        page.buttons.forEach(button => {
            if (button.type.includes('SaveChangesClientAction')){
                this.addErrors("PC1", ignoreRuleAnnotations);   
            } else if (button.type.includes('DeleteClientAction')){
                this.addErrors("PC2", ignoreRuleAnnotations);   
            }          
        });    
            if (page.containsCSS){
            this.addErrors("CS1", ignoreRuleAnnotations);
        }
        return this.errors;
    }
}
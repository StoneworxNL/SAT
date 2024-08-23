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

    check = function (mfQuality, page) {
        let errors = [];
        let ignoreRuleAnnotations = mfQuality.getIgnoreRuleAnnotations(page);
        page.buttons.forEach(button => {
            //console.log(`${page.module}:${page.name} ->  ${button.type}`);  
            if (button.type ==='Pages$SaveChangesClientAction'){
                this.addErrors(errors, "PC1", ignoreRuleAnnotations);   
            } else if (button.type ==='Pages$DeleteClientAction'){
                this.addErrors(errors, "PC2", ignoreRuleAnnotations);   
            }          
        });    
        return errors;
    }
}
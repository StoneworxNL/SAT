class Page {
    constructor(containerID, pageName, documentation) {
        this.containerID = containerID,
        this.documentation = documentation;
        this.name = pageName;
        this.allowedRoles = [];
        this.buttons = [];
    }

    
    static builder(pages){
        return pages.map(p => new Page(p.containerID, p.documentation, p.name, p.allowedRoles, p.buttons));
    }

    static parse(doc, container) {
        let containerID = container.toString('base64');
        let page = new Page(containerID, doc['Name'], doc['Documentation']);
        let allowedRoles = doc['AllowedRoled'];
        if (allowedRoles && allowedRoles.length > 1) {
            page.allowedRoles = allowedRoles.slice(1);
        }
        let args = doc['FormCall']['Arguments'];
        args.forEach(arg => {
            if (typeof arg != 'number') {
                let widgets = arg['Widgets'];
                page.parseWidgets(widgets);
            }
        });

        return page;
    }

    parseWidgets(widgets) {
        widgets.forEach(widget => {
            if (typeof widget != 'number') {
                this.parseWidget(widget);
            }
        })
    }

    parseWidget(widget) {
        if (typeof widget != 'number') {
            let widgetType = widget['$Type'];
            switch (widgetType) {
                case 'Forms$ActionButton':
                    let button = {'type': widget['Action']['$Type']}
                    this.buttons.push(button);
                    break;
                default:
                    let rows = widget['Rows'];
                    let columns = widget['Columns'];
                    let widgets = widget['Widgets'];
                    let footerWidgets = widget['FooterWidgets'];
                    if (rows){
                        this.parseWidgets(rows);
                    }
                    if (columns){
                        this.parseWidgets(columns);
                    }
                    if (widgets){
                        this.parseWidgets(widgets);
                    }
                    if (footerWidgets){
                        this.parseWidgets(footerWidgets);
                    }


            }
        }
    }

    getIgnoreRuleAnnotations() {
        let ignoreRuleAnnotations = [];
        ignoreRuleAnnotations = this.documentation.match(/^@SAT-([A-Z]{2}\d): .*/);
        if (ignoreRuleAnnotations) {
            return ignoreRuleAnnotations[1];
        }
        return [];
    }
}

module.exports = Page;
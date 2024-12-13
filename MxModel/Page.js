class Page {
    constructor(containerID, pageName, documentation) {
        this.containerID = containerID,
        this.documentation = documentation;
        this.name = pageName;
        this.allowedRoles = [];
        this.buttons = [];
    }

    static builder(pages) {
        return pages.map(p => new Page(p.containerID, p.documentation, p.name, p.allowedRoles, p.buttons));
    }

    static parse(doc, container) {
        let containerID = container.toString('base64');
        let page;
        let allowedRoles;
        let args;
        if (doc['$ID']) {
            page = new Page(containerID, doc['Name'], doc['Documentation']);
            allowedRoles = doc['AllowedModuleRoles'];
            if (allowedRoles && allowedRoles.length > 1) {

                page.allowedRoles = allowedRoles.slice(1);
            }
            args = doc['FormCall']['Arguments'];
            args.forEach(arg => {
                if (typeof arg != 'number') {
                    let widgets = arg['Widgets'];
                    page.parseWidgets(widgets);
                }
            });
        } else {
            page = new Page(containerID, doc['name'], doc['documentation']);
            allowedRoles = doc['allowedRoles'];
            page.allowedRoles = allowedRoles.flatMap(allowedRole => allowedRole.name);
            
            args = doc['layoutCall']['arguments'];
            args.forEach(arg => {
                if (typeof arg != 'number') {
                    let widgets = arg['widgets'];
                    page.parseWidgets(widgets);
                }
            });
        }

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
            let widgetType = widget['$Type'] || widget['structureTypeName'];
            switch (widgetType) {
                case 'Forms$ActionButton':
                case 'Pages$ActionButton':
                    let button;
                    if (widget['Action'] ){
                        button = { 'type': widget['Action']['$Type'] }
                    } else {
                        button = { 'type': widget['action']['structureTypeName'] }
                    }
                    this.buttons.push(button);
                    break;
                default:
                    let rows = widget['Rows'] ||widget['rows'];
                    let columns = widget['Columns'] ||widget['columns'];
                    let widgets = widget['Widgets']||widget['widgets'];
                    let footerWidgets = widget['FooterWidgets']||widget['footerWidgets'];;
                    if (rows) {
                        this.parseWidgets(rows);
                    }
                    if (columns) {
                        this.parseWidgets(columns);
                    }
                    if (widgets) {
                        this.parseWidgets(widgets);
                    }
                    if (footerWidgets) {
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
const fs = require("fs");

const MxModelObject = require('./MxModelObject');
class Page extends MxModelObject {
    constructor(containerID, moduleName, pageName, documentation, allowedRoles, buttons, containsCSS) {
        super();
        this.containerID = containerID,
        this.documentation = documentation;
        this.name = pageName;
        this.allowedRoles = allowedRoles || [];
        this.buttons = buttons || [];
        this.containsCSS = containsCSS;
        this.widgets = [];
        this.moduleName = moduleName;
        this.layoutName = '';
    }

    static builder(pages) {
        return pages.map(p => new Page(p.containerID, p.moduleName, p.name, p.documentation, p.allowedRoles, p.buttons, p.containsCSS));
    }

    static parse(doc, container, moduleName) {
        let containerID = container.toString('base64');
        let page;
        let allowedRoles;
        let args;
        let layoutCallName = doc.FormCall? doc.FormCall.Form : ''; 

        if (doc['$ID']) {
            page = new Page(containerID, moduleName, Page.findKey(doc, 'Name'), Page.findKey(doc, 'Documentation'));
            allowedRoles = Page.findKey(doc, 'AllowedModuleRoles');
            if (allowedRoles && allowedRoles.length > 1) {
                page.allowedRoles = allowedRoles.slice(1);
            }
            args = Page.findKey(doc, 'FormCall', 'Arguments');
            if (!args) { args = Page.findKey(doc, 'LayoutCall', 'Arguments') };
            if (doc['$Type'] === 'Forms$Snippet') {
                let widgets = Page.findKey(doc, 'Widgets');
                page.parseWidgets(widgets, null);
            } else {                        
                args.forEach(arg => {
                    if (typeof arg != 'number') {
                        let widgets = Page.findKey(arg, 'Widgets');
                        page.parseWidgets(widgets);
                    }
                });
            }
        } else {
            page = new Page(containerID, doc['name'], doc['documentation']);
            allowedRoles = doc['allowedRoles'];
            page.allowedRoles = allowedRoles.flatMap(allowedRole => allowedRole.qualifiedName);

            args = doc['layoutCall']['arguments'];
            args.forEach(arg => {
                if (typeof arg != 'number') {
                    let widgets = arg['widgets'];
                    page.parseWidgets(widgets);
                }
            });
        }

        page.layoutName = layoutCallName;
        return page;
    }

    parseWidgets(widgets, parentWidget) {
        widgets.forEach(widget => {
            if (typeof widget != 'number') {
                this.parseWidget(widget, parentWidget);
            }
        })
    }

    //Several widgets can contain other widgets, e.g. container, table, layoutgrid or even datagrid/gallery/etc
    //The structure in which these are stored can be nested deeply, so we use a generic function to pass the correct parent widget     
    parseWidgetChildNodes(childNodes,sourceWidget) {

        if(childNodes && childNodes.length > 1) {
            childNodes.forEach(childNode => {
                 if (typeof childNode != 'number') {

                    //any node can contain a Widgets[] array, which might contain more widgets
                    if (childNode.Widgets) {
                        this.parseWidgets(childNode.Widgets, sourceWidget);
                    }

                    //dataview has footer widgets (e.g. for the save/cancel buttons)
                    if(childNode.FooterWidgets) {
                        this.parseWidgets(childNode.FooterWidgets, sourceWidget);
                    }

                    //Layoutgrid widget has Rows->Columns->Widgets
                    if (childNode.Rows) {
                        this.parseWidgetChildNodes(childNode.Rows, sourceWidget);
                    }

                    if (childNode.Columns) {
                        this.parseWidgetChildNodes(childNode.Columns, sourceWidget);
                    }

                    //Table widget has cells
                    if (childNode.Cells) {
                        this.parseWidgetChildNodes(childNode.Cells, sourceWidget);
                    }

                    //widgets with a custom canvas for child widgets (e.g. datagrid2 custom content column, gallery) have properties, which have objects, which can have more widgets.
                    if(childNode.Properties) {
                        this.parseWidgetChildNodes(childNode.Properties, sourceWidget);
                    }
                    if(childNode.Objects) {
                        this.parseWidgetChildNodes(childNode.Objects, sourceWidget);
                    }
                    //special case for DataGrid2: the Value object (as child of a Properties array) can contain widgets as well as a separate  Objects array (the array could contain more widgets)
                    if (childNode.Value) {
                        this.parseWidgetChildNodes(childNode.Value.Objects, sourceWidget);
                        this.parseWidgets(childNode.Value.Widgets, sourceWidget);
                    }
                }
            });
        }

    }

    parseWidget(widget, parentWidget) {
        //console.log(JSON.stringify(widget, null, 4));

        let widgetType = widget['$Type'] || widget['structureTypeName'];
        
        this.addWidget(widget, parentWidget);

        if (typeof widget != 'number') {

  
            let css = Page.findKey(widget, 'appearance', 'style');
            if (css) {
                css = css.trim().replace(/\s+/g, ' ');
                if (css) {
                    //console.log(`page: ${this.name}; widget: ${widget.Name} - ${widgetType} contains css`);
                    this.containsCSS = true
                };
            }
            switch (widgetType) {
                case 'Forms$ActionButton':
                case 'Pages$ActionButton':
                    widgetType = 'Forms$ActionButton';
                    let button;
                    let actionType;
                    let action = Page.findKey(widget, 'Action');
                    if (action) {
                        actionType = Page.findKey(action, '$Type');
                    } else {
                        actionType = widget['action']['structureTypeName']
                    }
                    switch (actionType) {
                        case 'Pages$MicroflowClientAction':
                            actionType = 'Forms$MicroflowAction';
                            break;
                        case 'Pages$SaveChangesClientAction':
                            actionType = 'Forms$SaveChangesClientAction';
                            break;
                        case 'Pages$DeleteClientAction':
                            actionType = 'Forms$DeleteClientAction';
                            break;
                        case 'Pages$CancelChangesClientAction':
                            actionType = 'Forms$CancelChangesClientAction';
                            break;
                        case 'Pages$OpenLinkClientAction':
                            actionType = 'Forms$OpenLinkClientAction';
                            break;
                        case 'Pages$ClosePageClientAction':
                            actionType = 'Forms$ClosePageClientAction';
                            break;
                        case 'Pages$PageClientAction':
                            actionType = 'Forms$FormAction';
                            break;
                        case 'Pages$NoClientAction':
                            actionType = 'Forms$NoAction';
                            break;
                        case 'Pages$CallNanoflowClientAction':
                            actionType = 'Forms$CallNanoflowClientAction';
                            break;
                    }
                    button = { 'type': actionType };
                    this.buttons.push(button);                    
                    break;
                case "Forms$LayoutGrid":
                    let rows = widget['Rows'] || widget['rows'];
                    this.parseWidgetChildNodes(rows,widget);
                    break;
                case "CustomWidgets$CustomWidget" :
                    let properties = widget.Object['Properties'] || widget.Object['properties'];
                    this.parseWidgetChildNodes(properties, widget);
                    break;
                case "Forms$TabControl" :
                    let tabPages = widget.TabPages;
                    this.parseWidgets(tabPages, widget);
                    break;
                default:

                    let widgets = widget['Widgets'] || widget['widgets'];
                    let footerWidgets = widget['FooterWidgets'] || widget['footerWidgets'];

                    if (widgets) {
                        this.parseWidgets(widgets, widget);
                    }
                    if (footerWidgets) {                        
                        this.parseWidgets(footerWidgets, widget);
                    }
            }
        }
    }

    getIgnoreRuleAnnotations() {
        let ignoreRuleAnnotations = [];
        let documentation = this.documentation;
        if (documentation) {
            ignoreRuleAnnotations = this.documentation.match(/^@SAT-([A-Z]{2}\d): .*/);
            if (ignoreRuleAnnotations) {
                return ignoreRuleAnnotations[1];
            }
        }
        return [];
    }

    addWidget(widget, parentWidget) {

        let widgetName = widget['Name'];
        let parentWidgetName = parentWidget? parentWidget['Name'] : '';
        let basewidgetType = widget['$Type'] || widget['structureTypeName'];
        let widgetType;
        let targetPageID = '';

        // All widgets which are not built-in platform widgets are listed as "CustomWidgets$CustomWidget"
        // In order to capture the specific widget type (e.g. for DataGrid2, Gallery, Timeline, etc) we use the following switch
        // Also, we need to check if the custom widget has any child widgets, which also should be added to the complete list..
        switch(basewidgetType) {
            case "CustomWidgets$CustomWidget" :
                widgetType = widget.Type.WidgetId;                        
                break;
            case "Forms$SnippetCallWidget" :
                widgetType = basewidgetType;
                targetPageID = widget.FormCall.Form;
                break;
            default:
                widgetType = basewidgetType;
                break;
        }

        //for debugging only: write widget definition to a file to see the structure without going through 200MB of code
        //if(widgetType === "Forms$TabControl") {
        //    fs.writeFileSync('output/logging/'+this.name +'.'+ widgetType+'.json',JSON.stringify(widget, null, 2));            
        //}

        if(widgetName) {        
            const widgetdefinition = {
                name: widgetName,
                type: widgetType,
                parent: parentWidgetName,
                targetPage: targetPageID
            }
            this.widgets.push(widgetdefinition);
        }
    }
}

module.exports = Page;
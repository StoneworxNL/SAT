const c = require("config");
const { log } = require("console");
const fs = require("fs");

// Enhancements (possibly) to be implemented:
// 1) Introduce generic class for Mendix Pages? (see also the next point)
// 2) For pages: is it a popup(layout) or not, as this influences the locator (potential duplicates of the input widget locators)
// 3) For widgets: extend widget types and utility classes for more coverage: ComboBox, DataGridTextFilter,DatePicker,FIleManager,DataView,Label,DynamicText,DivContainer, etc
// 4) Support for snippets (especially test how to deal with snippets containing mx-names that are also used on the main page)


module.exports = class PlaywrightBuilder {    

    constructor(model, outFilePath) {
        this.model = model;
        this.outFilePath = outFilePath;
        this.importstatements = '';
        this.widgetTypes = [];
        this.widgetDeclarations = '';
        this.classConstructor = '';          
    }

    report() {
        console.log('writing pages to path: ' + this.outFilePath);
        this.model.pages.forEach(page => {
            console.log('writing page: ' + page.name);
            this.writePage(page);
        });
    }

    writePage(page) {
        const pageName = page.name;
        const module = page.moduleName;   
        this.widgetDeclarations = '';
        this.classConstructor = '';  
        this.widgetDefinitions = '';
        this.widgetTypes = [];
        this.importstatements = fs.readFileSync('SAT-UI/imports.js','utf8');

        //providing the page context based on layout type (popups are modeled as a div inside the page which needs to be explicitly targeted)
        
        // Top-level widgets should always use a locator based on the page context. 
        // We will add a common Locator for top-level widgets to make sure that e.g. widgets in popups are also located successfully
        const layoutName = page.layoutName;
        const layoutType = this.getLayoutType(layoutName);        

        let contextPath = 'this.page.locator("#content")';

        switch(layoutType) {
            case "Popup" :
            case "ModalPopup" :
                contextPath = 'this.page.getByRole("dialog").last()';
                break;
            case undefined :
            case "Responsive" :
                break;
            default:
                console.log('unknown layout type: ' + layoutType);
                break;
        }


        this.classConstructor += `
        if(typeof context !== 'undefined') {
            this.pageContext = context;
        }
        else {
            this.pageContext = ${contextPath};
        }`


        

        //adding the widgets
        this.writewidgets(page);


        const data = `
${this.importstatements}
         
class ${pageName}  {

    page: Page;
    pageContext: Locator;
    ${this.widgetDeclarations}

    constructor(page: Page, context?: Locator) {
        this.page = page;        
        ${this.classConstructor}
    }    
}

export default ${pageName}`;

        // last but not least, we write the page file to disk
        fs.writeFileSync(this.outFilePath+'/'+module+'.'+pageName+'.ts',data);
    }


    //Function to loop through all widgets on it and build the necessary text parameters to complete the class definition for a page
    writewidgets(page) {         

        page.widgets.forEach(widgetDefinition => {

            const widgetClass = this.getWidgetClass(widgetDefinition);
            let parentWidget = widgetDefinition.parent? 'this.'+ widgetDefinition.parent +'.locate()' : 'this.pageContext';            

           if (typeof widgetClass !== 'undefined') {
                if(widgetClass === 'SnippetCall') {
                    this.includeSnippet(widgetDefinition, page.moduleName, parentWidget);
                }
                else {
                    this.includeWidget(widgetClass, widgetDefinition.name,parentWidget);
                }
                

                this.widgetDefinitions += `
    public ${widgetDefinition.name}(): ${widgetClass} {
        return this.wgt${widgetDefinition.name};
    }`;

            }


        });

    }

    // Normal widgets (anything other than snippet calls) require an import statement (if the same widget type does not exist on the page yet), as well as an initilization for the specific widget class.
    includeWidget(widgetClass, widgetName, widgetContext) {

        if (widgetClass && this.widgetTypes.indexOf(widgetClass) === -1) {
            this.importstatements += `
import { ${widgetClass} } from '../utils/widgets/${widgetClass}';`
            this.widgetTypes.push(widgetClass);

        }

        this.widgetDeclarations += `
    ${widgetName} : ${widgetClass};`;

        this.classConstructor += `
        this.${widgetName} = new ${widgetClass}(this.page,'${widgetName}', ${widgetContext} );`


    }

    // Snippet calls are a special type of 'widgets', as in the model it is returned as its own page (with containing widgets)
    // So for snippet calls we need a separate function to take this into account
    includeSnippet(widgetDefinition, moduleName, widgetContext) {

        const targetPage = widgetDefinition.targetPage;
        const snippetClass = targetPage.replace(moduleName+'.','');

         this.importstatements += `
import  ${snippetClass} from './${targetPage}';`

        this.widgetDeclarations += `
    ${widgetDefinition.name} : ${snippetClass};`;

            this.classConstructor += `
        this.${widgetDefinition.name} = new ${snippetClass}(this.page, ${widgetContext});`

    }

    getWidgetClass(widgetDefinition) {
            let widgetType = "MendixWidget";

            switch(widgetDefinition.type) {
                // Known widgets that will not be supported or even added to the page 
                // For example, we are not going to validate/test the feedback widget, unless someone has a valid usecase to include this
                // Also includes widgets that might be defined on a page but have no specific UI component(s) that can be tested
                case "SprintrFeedbackWidget.SprintrFeedback":
                case "MicroflowTimer.widget.MicroflowTimer" :
                    widgetType = undefined;
                    break;
                // ToDo: analyze the effect of snippet calls. If a snippet is considered a page object, we might need to refer to the page class
                // In any case, any widget(s) in the snippet call need to be accessible from the page
                // This is not yet implemented!
                case "Forms$SnippetCallWidget" :
                    widgetType = "SnippetCall";
                    break;
                //Built-in Mendix widgets                
                case "Forms$TextBox" :
                    widgetType = "TextBox";
                    break;
                case "Forms$TextArea" :
                    widgetType = "TextArea";
                    break;
                case "Forms$DatePicker" :
                    widgetType = "DatePicker";
                    break;
                case "Forms$ActionButton" :
                    widgetType = "ActionButton";
                    break;
                case "Forms$RadioButtonGroup" :
                    widgetType = "RadioButtonGroup";
                    break;
                case "Forms$CheckBox" :
                    widgetType = "CheckBox";
                    break;
                //TODO: Verify whether all these widgets can be handled by a single Label class or that we need to split them..
                case "Forms$DynamicText" :
                case "Forms$Title" :
                case "Forms$Label" :
                    widgetType = "Label";
                    break;
                case "Forms$FileManager" : //TODO
                    widgetType = "FileManager";
                    break;
                // potentially static and normal image viewers share the same structure and functionality (except the source is different). This needs to be tested though!
                case "Forms$StaticImageViewer" :
                case "Forms$ImageViewer" :
                    widgetType = "ImageViewer";
                    break;
                case "Forms$TabControl" :
                    widgetType = "TabControl";
                    break;
                // Reference selectors and dropdowns should behave in the same way, except with a different source. 
                // Still need to verify whether that is indeed the case!
                // If not, then reference selector moves to the 'unsupported Dojo widgets' list first
                case "Forms$ReferenceSelector":
                case "Forms$DropDown" :
                    widgetType = "DropDown";
                    break;
                case "Forms$GroupBox" :
                    widgetType = "GroupBox";
                    break;
                case "Forms$MenuBar" :
                    widgetType = "MenuBar";
                    break;
                case "Forms$NavigationTree" :
                    widgetType = "NavigationTree";
                    break;
                // The widgets from the "Data Widgets" marketplace module
                case "com.mendix.widget.web.datagrid.Datagrid" :
                    widgetType = "DataGrid2";
                    break;
                case "com.mendix.widget.web.gallery.Gallery" :
                    widgetType = "Gallery";
                    break;
                case "com.mendix.widget.web.combobox.Combobox" :
                    widgetType = "ComboBox";
                    break;
                //again, need to see if these can be combined or not.
                case "com.mendix.widget.web.datagridtextfilter.DatagridTextFilter" :
                case "com.mendix.widget.web.datagridnumberfilter.DatagridNumberFilter" :
                case "com.mendix.widget.web.datagriddropdownfilter.DatagridDropdownFilter" :
                case "com.mendix.widget.web.datagriddatefilter.DatagridDateFilter" :
                    widgetType = "DataGrid2Filter";
                    break;
                case "com.mendix.widget.web.accordion.Accordion" :
                    widgetType = "Accordion";
                    break;
                case "com.mendix.widget.web.tooltip.Tooltip" :
                    widgetType = "ToolTip";
                    break;
                case "com.mendix.widget.web.timeline.Timeline" :
                    widgetType = "TimeLine";
                    break;
                case "com.mendix.widget.web.popupmenu.PopupMenu" :
                    widgetType = "PopupMenu";
                    break;
                case "com.mendix.widget.custom.richtext.RichText" :
                    widgetType = "RichText";
                    break;
                //can it be a simple dropdown or do we need custom class for Language Selector widget?
                case "com.mendix.widget.web.languageselector.LanguageSelector" :
                    widgetType = "DropDown";
                    break;
                // The following widgets are either layout or virtual widgets (like layoutgrid or dataview)
                // For these we will use the generic "MendixWidget" class as there are no specific functions needed to set or retrieve a value
                case "Forms$LayoutGrid" :
                case "Forms$DataView" :
                case "Forms$DivContainer" :
                case "Forms$Table" :
                case "Forms$TabPage" : // Tabpages can only be clicked      
                    break;
                case "com.mendix.widget.custom.switch.Switch" :
                    widgetType = "Switch";
                    break;

                //TODO LIST
                //planned to be supported in the future, but not yet (the main todo-list after the built-in widgets + DataWidgets module):
                case "Counter.widget.Counter" :
                case "com.mendix.widget.custom.slider.Slider" :
                case "com.mendix.widget.web.image.Image" :
                    break;

                // Templategrid, list view & datagrid1 are quite common but are lower on the priority list (Dojo widgets without a future, should we even implement this?). 
                // Another reason to switch to Gallery, Datagrid2, Combo Box, etc!
                case "Forms$TemplateGrid" :
                case "Forms$ListView" :
                case "Forms$DataGrid" :
                case "Forms$DataGridColumn" :
                case "Forms$InputReferenceSetSelector" :
                case "Forms$NavigationList" :       
                    break;


                // Other widgets (mostly either not from Mendix or without platform support). These widgets are known but we don't have any implementation just yet 
                // Custom class implementations should not be implemented until all the built-in widgets and Mendix platform supported widgets (see above) are supported first!
                case "mendix.texttemplateelement.TextTemplateElement" :
                case "HTMLSnippet.widget.HTMLSnippet" :
                case "mendix.dropdowncontainer.DropdownContainer" :
                case "com.mendix.widget.web.columnchart.ColumnChart" :
                case "com.mendix.widget.web.linechart.LineChart" :
                case "mendix.customdropdown.CustomDropdown":
                case "toastrForMendix.widget.toastrForMendix":
                case "Counter.widget.Counter" :
                case "mendix.advanceddatepicker.AdvancedDatePicker" :
                case "rabobank.rabosessiontimeout.RaboSessionTimeout" :
                case "CheckboxSelector.widget.checkboxselector" :
                case "com.mendix.widget.web.markdown.Markdown" :
                case "RadioButtonList.widget.AssocRadioButtonList" :
                case "SimpleCheckboxSetSelector.widget.SimpleCheckboxSetSelector" :
                    break;
                                                  
                default:
                    //dump widget type to console if it has never been encountered before. IWe will keep the generic MendixWIdget class as the main div should be clickable
                    console.log("UNKNOWN_WIDGET: " + widgetDefinition.type);                    
                    break;                    
            }

            return widgetType;

    }

    getLayoutType(layoutName) {
        if(layoutName) {
            const layoutDefinition = this.model.layouts.find((layout) => layout.name === layoutName);
            return layoutDefinition? layoutDefinition.layoutType : undefined;
        }
        else {
            return undefined;
        }        
    }
}

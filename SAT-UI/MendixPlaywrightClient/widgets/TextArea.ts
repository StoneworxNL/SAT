import { type Locator, type Page } from '@playwright/test';
import { MendixWidget } from './MendixWidget';

// Helper utility class to work with Mendix textarea widgets within a Playwright context
export class TextArea extends MendixWidget {
    inputElement: Locator;

    constructor(page: Page, mxName: string, context?: Locator) {
        super(page, mxName, context);
        this.inputElement = this.locate().locator('textarea');        
    }

    // Note that Mendix considers integer and decimal inputs as textboxes as well. 
    // Since we don't have a way to determine the datatype of an attribute using the model (yet),
    // there are multiple overloads for the setValue() function...
    async setValue(value: string) {
        await this.inputElement.click();
        await this.inputElement.fill(value.toString());
    }

    getValue() {
        this.inputElement.inputValue();
    }

}
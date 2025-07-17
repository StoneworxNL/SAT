import { type Locator, type Page } from '@playwright/test';
import { MendixWidget } from './MendixWidget';

// Helper utility class to work with Mendix textbox widgets within a Playwright context
export class CheckBox extends MendixWidget {
    inputElement: Locator;

    constructor(page: Page, mxName: string, context?: Locator) {
        super(page, mxName, context);
        this.inputElement = this.locate().locator('input');        
    }

    // Note that Mendix considers integer and decimal inputs as textboxes as well. 
    // Since we don't have a way to determine the datatype of an attribute using the model (yet),
    // there are multiple overloads for the setValue() function...
    async setValue(targetValue: boolean) {
        await this.inputElement.setChecked(targetValue);
    }

    async toggle() {
        const currentValue = await this.getValue();
        //await this.inputElement.setChecked(!currentValue);
        await this.inputElement.click();
    }

    async getValue(): Promise<boolean> {
        const currentValue = await this.inputElement.isChecked();
        return currentValue;
    }

}
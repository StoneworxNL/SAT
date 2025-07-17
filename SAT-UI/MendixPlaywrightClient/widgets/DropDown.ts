import { type Locator, type Page } from '@playwright/test';
import { MendixWidget } from './MendixWidget';

// Helper utility class to work with Mendix textbox widgets within a Playwright context
export class DropDown extends MendixWidget {
    inputElement: Locator;
    menuOptions: Locator;

    constructor(page: Page, mxName: string, context?: Locator) {
        super(page, mxName, context);
        this.inputElement = this.locate().locator('select');        
        this.menuOptions = this.inputElement.locator('option');
    }

    async selectFirst() {
        let firstOptionLabel = await this.menuOptions.nth(0).inputValue();
        await this.setValue(firstOptionLabel);
    }

    async setValue(optionLabel: string) {
        await this.inputElement.selectOption(optionLabel);
    }

    async getValue(): Promise<string | null> {

        let selectedValue: string | null = await this.inputElement.getAttribute('value');
        return selectedValue;

    }

    
}
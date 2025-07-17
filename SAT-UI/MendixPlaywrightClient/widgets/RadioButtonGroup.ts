import { type Locator, type Page } from '@playwright/test';
import { MendixWidget } from './MendixWidget';

// Helper utility class to work with Mendix textbox widgets within a Playwright context
export class RadioButtonGroup extends MendixWidget {
    radioOptions: Locator;

    constructor(page: Page, mxName: string, context?: Locator) {
        super(page, mxName, context);
        this.radioOptions = this.locate().locator('input');        
    }

    async selectFirst() {
        await this.radioOptions.nth(0).click();
    }

    async setValue(optionLabel: string) {
        const selectOption = this.locate().getByLabel(optionLabel);
        await selectOption.click();
    }

    async getValue() {
        const optionElements = await this.radioOptions.all();
        let selectedValue;



        for (const option of optionElements) {
            const isSelected = await option.isChecked();
            if(isSelected === true) {
                selectedValue = await option.inputValue();
            } 
        }

        return selectedValue;

    }
    
}
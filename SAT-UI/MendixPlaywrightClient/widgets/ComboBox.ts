import { type Locator, type Page } from '@playwright/test';
import { MendixWidget } from './MendixWidget';

// Helper utility class to work with Mendix textbox widgets within a Playwright context
export class ComboBox extends MendixWidget {
    inputFilter: Locator;
    popUpMenu: Locator;
    menuOptions: Locator;
    clearButton: Locator;
    expandMenuOptionsButton: Locator;
    expandButton: Locator;
    valuePlaceholder: Locator;

    constructor(page: Page, mxName: string, context?: Locator) {
        super(page, mxName, context);
        this.inputFilter = this.locate().locator('input.widget-combobox-input');
        this.popUpMenu = this.locate().locator('ul');
        this.menuOptions = this.locate().locator('ul li');
        this.clearButton = this.locate().locator('.widget-combobox-clear-button');
        this.expandButton = this.locate().locator('.widget-combobox-down-arrow');
        this.valuePlaceholder = this.locate().locator('.widget-combobox-placeholder-text');
    }

    // TODO: retrieving and setting the value
    // Should support 'query by example', as well as selecting without typing
    // To check: if it's possible to extract whether filtering is enabled or not

    async filterMenuOptions(filterValue: string) {
        await this.inputFilter.click();
        await this.inputFilter.fill(filterValue);
        await this.popUpMenu.waitFor();
    }

    async selectFirst() {
        if(await this.popUpMenu.isVisible() === false) {
            await this.toggleMenuOptions();
        }

        await this.menuOptions.nth(0).click();
    }

    async selectSingleValueFromDropDown(value: string) {
        await this.showMenuItems();

        let isItemAvailable: boolean = false;

        for (const menuItem of await this.menuOptions.all()) {
            const label = await menuItem.innerText();
            if (label === value) {
                await menuItem.click();
                isItemAvailable = true;
            }            
        }

        if (!isItemAvailable) {
            throw new Error('menu option'+ value + ' not found');
        }
        
    }

    async selectMultiValueFromDropDown(values: string[]) {
        for (const value of values) {
            await this.selectSingleValueFromDropDown(value);
        }
    }

    // Toggles state of the popupmenu (show the menu if currently closed, or hide if already open)
    async toggleMenuOptions() {
        console.log('toggling menu options');

        const isPopupOpen = await this.popUpMenu.isVisible();   

        if (isPopupOpen === true) {
            await this.hideMenuItems();
        }
        else {
            await this.showMenuItems();
        }
    }

    //Use the clear button to clear the existing value
    async clearValue() {
        await this.clearButton.click();
    }

    //return the display value for the selected menu items (if any)
    async getValue() : Promise<string> {
       return await this.valuePlaceholder.innerText();
    }

    // shows the dropdown with menu options (if already open, this function does nothing)
    async showMenuItems() {
        const isPopupOpen = await this.popUpMenu.isVisible();

        if (isPopupOpen === false) {
            await this.expandButton.click();
            await this.popUpMenu.waitFor();
        }  
    }
            

    // hides the dropdown with menu options (if already closed, this function does nothing)
    async hideMenuItems() {
        const isPopupOpen = await this.popUpMenu.isVisible();

        if (isPopupOpen === true) {
            await this.expandButton.click();
            await this.popUpMenu.waitFor({state: 'hidden'});
        }
    }
    

}
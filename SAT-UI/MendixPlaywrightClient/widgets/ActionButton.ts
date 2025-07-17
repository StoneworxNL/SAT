import { type Locator, type Page } from '@playwright/test';
import { MendixWidget } from './MendixWidget';

// Helper utility class to work with Mendix textbox widgets within a Playwright context
export class ActionButton extends MendixWidget {
    inputElement: Locator;

    constructor(page: Page, mxName: string, context?: Locator) {
        super(page, mxName, context);     
    }

    // Currently there is no specific implementation other than clicking for buttons
    // In the future, we could include more information from the model like whether the button opens a page, and then returning an instance of the target page class...

}
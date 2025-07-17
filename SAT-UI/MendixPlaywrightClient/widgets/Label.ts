import { type Locator, type Page } from '@playwright/test';
import { MendixWidget } from './MendixWidget';

// Helper utility class to work with Mendix textbox widgets within a Playwright context
export class Label extends MendixWidget {
    inputElement: Locator;

    constructor(page: Page, mxName: string, context?: Locator) {
        super(page, mxName, context);
        this.inputElement = this.locate().locator('input');        
    }

    // TODO: getValue() operation...

}
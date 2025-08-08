import { type Locator, type Page } from '@playwright/test';
import { MendixWidget } from './MendixWidget';

// Helper utility class to work with Mendix textbox widgets within a Playwright context
export class FileManager extends MendixWidget {
    inputElement: Locator;

    constructor(page: Page, mxName: string, context?: Locator) {
        super(page, mxName, context);
    }

    //TODO!

}
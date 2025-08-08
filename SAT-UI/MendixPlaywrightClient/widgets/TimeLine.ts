import { type Locator, type Page } from '@playwright/test';
import { MendixWidget } from './MendixWidget';

//Helper utility class to work with Mendix timeline widgets within a Playwright context
export class TimeLine extends MendixWidget {

    constructor(page: Page, mxName: string, context?: Locator) {
        super(page, mxName, context);
    }


    //Function to get a locator matching a specific row number. Noite that the nth() function is zero-based, so to get row 1 the index should be set to zero
    locateTimelineEntry(rowNumber: number): Locator {
        return this.getEntryLocator().nth(rowNumber - 1);
    }
    
    //Function to get a locator object matching a row inside the specific datagrid
    getEntryLocator() : Locator {
        return this.locate().locator('div.widget-timeline-events-wrapper > ul > li');
    }


    //A Locator match returns the 'first matching item'. getAllRows returns all of them in an array, which can be used to loop all rows
    async getAllEntries(): Promise<Locator[]> {
        return this.getEntryLocator().all();
    }

}
import { type Locator, type Page } from '@playwright/test';
import { MendixWidget } from './MendixWidget';

//Helper utility class to work with Mendix datagrid widgets within a Playwright context
export class Gallery extends MendixWidget {

    constructor(page: Page, mxName: string, context?: Locator) {
        super(page, mxName, context);        
    }

    //Function to get a locator matching a specific cell in a gallery using the data-position attribute (which is a 0-based index)
    locateGalleryEntry(columnNumber: number, rowNumber: number): Locator {
        return this.getEntryLocator().locator('[data-position='+(columnNumber - 1)+','+ (rowNumber - 1) +']');
    }


    //Function to get a locator object matching a row inside the specific datagrid
    getEntryLocator() : Locator {
        return this.locate().getByRole('listitem');
    }


    //A Locator match returns the 'first matching item'. getAllRows returns all of them in an array, which can be used to loop all rows
    async getAllEntries(): Promise<Locator[]> {
        return this.getEntryLocator().all();
    }

}
import { type Locator, type Page, expect } from '@playwright/test';

export class MendixWidget {
    mxName: string;
    locatorPath: string;
    context?: Locator;
    page: Page;

    constructor(page: Page, mxName: string, context?: Locator ) {
        this.mxName = mxName;
        this.context = context;
        this.page = page
        this.locatorPath = '.mx-name-' + mxName;
    }

    locate(): Locator {

        // const path = `.mx-name-${this.mxName}`;        

        if(this.context) {
            return this.context.locator(this.locatorPath);
        }
        else {
            return this.page.locator(this.locatorPath);
        }

    }

    //clicking buttons and entering fields might trigger UI changes like showing pages, progress bars or conditional visiblity
    //This method serves as a generic method to see if these actions are finished (at least waiting for progress bars)
    async waitForMendixEvents() {
        await expect(this.page.locator('.mx-progress-indicator')).toHaveCount(0);
        await expect(this.page.locator('div.mx-offscreen.mx-incubator > *')).toHaveCount(0);
    }

    //shortcut/helper function for the click() function
    async click() {
        await this.locate().click();
        await this.waitForMendixEvents();
    }

    locateWithin(parent: Locator) {
        return parent.locator(this.locatorPath);
    }

}
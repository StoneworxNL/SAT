import { type Page, type Locator , expect } from '@playwright/test';

export class MxPlaywrightClient {
    readonly page: Page;
    readonly mxContent: Locator;

    constructor(page: Page) {
        this.page = page;
        this.mxContent = page.locator("#content");
    }

    getPageLocator() : Locator {
        return this.mxContent;
    }

    getPopup() : Locator {
        //Note: the div with role dialog is inserted directly as child of the body (and sibling to the content div)
        //So we want to search in the page and not in the content div (this.mxContent)
        //If there is a modal popup shown on top of another modal popup, there is no way to distinguish the active window. so take the last one in the DOM as they are generated in order
        return this.page.getByRole("dialog").last();
    }

    async awaitProgressBar() {
        await expect (this.mxContent.locator('.mx-progress-indicator')).toHaveCount(0);
        await expect (this.page.locator('div.mx-offscreen.mx-incubator > *')).toHaveCount(0);
    }
}
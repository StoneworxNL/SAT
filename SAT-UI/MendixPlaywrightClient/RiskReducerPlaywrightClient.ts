import { type Page, type Locator , expect } from '@playwright/test';
import { MxPlaywrightClient } from './mendixPlaywrightClient';
import ApplicationDetailPage from "../pageObjects/application_page";

export class RiskReducerPlaywrightClient extends MxPlaywrightClient {

    constructor(page: Page) {
        super(page);
    }

    async navigateHome() {
        const homeMenu = this.getPageLocator().getByRole('menuitem', { name: 'Home' });
        await homeMenu.click();
        this.awaitProgressBar();

        // After navigating, wait until the home page button is visible again before returning!
        await homeMenu.waitFor();
    }

    // Start from home page, search an application and show the detail view with all questionnaires.
    async navigateToApplicationDetailView(applicationName: string): Promise<ApplicationDetailPage> {

        // Show home page, wait until the "search" input placeholder is available
        await this.navigateHome();
        await expect(this.getPageLocator().locator('text=Add application')).toHaveCount(1);
        const searchfld = this.getPageLocator().getByPlaceholder('Search', { exact: true });
        await expect(searchfld).toBeEditable();         

        // Enter application name in search field
        await searchfld.click();
        await searchfld.fill(applicationName);
        //DG2 search has no progress bar, we cannot listen for completion of the search operation..
        await this.page.waitForTimeout(1000);

        // After search, we expect only 1 row to be visible
        const myApplicationsGrid = this.getDataGrid2('dataGrid21');
        const resultCount = await myApplicationsGrid.getRowLocator().count(); 
        expect(resultCount).toBe(1);


        // click the chevron-right (">") button to show the application detail page
        const showDetailsBtn = myApplicationsGrid.locateCellByIndex(1,7).getByRole('button');
        await showDetailsBtn.click();
        //give some time for the new page to load, as datagrid 2 needs to be initialized first...
        await this.page.waitForTimeout(1000);

        return new ApplicationDetailPage();
    }

    async navigateToReviewerTasks() {
        await this.navigateHome();
        const menuReviewerTasks = this.getPageLocator().getByRole('menuitem', { name: 'Reviewer tasks' });
        await expect(menuReviewerTasks).toBeVisible();
        await menuReviewerTasks.click();
        
        //give some time for the new page to load, as datagrid 2 needs to be initialized first...
        await this.page.waitForTimeout(500);
    }

}
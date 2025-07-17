import { type Page, type Locator , expect } from '@playwright/test';

class mendixLocator {
    readonly page: Page;

    constructor(page: Page) {
        this.page = page;
    }

    // Data Grid 2
    locatedataGrid2(mxname: string): Locator {
        return this.page.locator('div.widget-datagrid.mx-name'+mxname);
    }
}

class DataGrid2 {
    readonly page: Page;
    readonly widget: Locator;

    constructor(page: Page, mxname: string) {
        this.page = page;
        this.widget = this.locatedataGrid2(mxname);
    }

    locatedataGrid2(mxname: string): Locator {
        return this.page.locator('div.widget-datagrid.mx-name-'+mxname);
    }

    locateRowByIndex(index: number) {
        return this.widget.locator('div.widget-datagrid-grid-body > div.tr:nth-child('+index+')');
    }

    locateCellByIndex(rowIndex: number, colIndex: number) {
        return this.locateRowByIndex(rowIndex).locator('div.td:nth-child('+colIndex+')');
    }

}

export default DataGrid2;

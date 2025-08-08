import { type Locator , type Page, expect } from '@playwright/test';
import { MendixWidget } from './MendixWidget';

//Helper utility class to work with Mendix datagrid widgets within a Playwright context
export class DataGrid2 extends MendixWidget {
    

    constructor(page: Page, mxName: string, context?: Locator) {
        super(page, mxName, context);
    }

    //Function to get a locator matching a specific row number. Noite that the nth() function is zero-based, so to get row 1 the index should be set to zero
    locateRowByRowNumber(rowNumber: number): Locator {
        return this.getRowLocator().nth(rowNumber - 1);
    }

    //Function to get a Locator object matching a specific cell inside the datagrid
    locateCellByIndex(rowIndex: number, colIndex: number) : Locator {
        return this.locateRowByRowNumber(rowIndex).locator('div.td:nth-child('+(colIndex+1)+')');
    }

    //Function to get a locator object matching a row inside the specific datagrid
    getRowLocator() : Locator {
        return this.locate().locator('div.widget-datagrid-grid-body > div.tr');
    }

    //Function to map the columns in a list of <columName>,<columnIndex>.
    //It makes it easier to get the column index based on the expected column title instead of using hardcoded column indexes
    async getColumnMap(): Promise<Map<string,number>> {                
        const columnsLocator = this.locate().locator('div.widget-datagrid-grid-head').getByRole('columnheader');
        const columnCount = await columnsLocator.count();

        let columns = new Map();
       
        for (let i=0; i< columnCount; i++) {
            const columnElement = columnsLocator.nth(i);
            const columnTitle = await columnElement.getAttribute('title'); //NOTE: still needs to be tested on a datagrid with 'empty' column titles!
            columns.set(columnTitle, i);            
        }

        return columns;
    }

    //Function to return the specific index based on a column title
    async getColumnIndexByTitle(title: string) : Promise<number | undefined> {
        const colMap =  await this.getColumnMap();
        return colMap.get(title);
    }

    //A Locator match returns the 'first matching item'. getAllRows returns all of them in an array, which can be used to loop all rows
    async getAllRows(): Promise<Locator[]> {
        return this.getRowLocator().all();
    }

    //Function to find a specific row (locator) based on an expected value in a specific column
    async locateMatchingRows(columnName: string, expectedValue: string) : Promise<Locator> {

        //Check if column title is matched in the grid
        const colIndex = await this.getColumnIndexByTitle(columnName);
        expect(colIndex).toBeDefined();

        // To validate that a value exists in a specific columns, we will iterate each row in the table
        const rows = await this.getAllRows();
        if(colIndex !== undefined) {
            let i = 0;
            for(const row of rows) {
                //fetch actual value for the column in a specific row.
                const rowValue = await row.getByRole('gridcell').nth(colIndex).innerText();
                if ( rowValue === expectedValue) {
                    //if a match is found, return a Locator matching the entire row and based on the specific row number
                    return this.getRowLocator().nth(i);
                }
                i++;
            }
        }

        //if no rows are found, we want the test script to abort!
        expect('When this point is reached, no rows were found').toBeNull();

        //The function requires a return statement, but it will never be reached as the expect function above will terminate the script if there are no matching rows.
        return this.getRowLocator().getByRole('gridcell').filter({ hasText: expectedValue });
    }

    //based on a row locator, returns the value in column x. x is a number from 1 up to the number of columns
    locateCellInRow(row: Locator, columnNumber: number) : Locator {

        return row.getByRole('gridcell').nth(columnNumber -1);

    }

}
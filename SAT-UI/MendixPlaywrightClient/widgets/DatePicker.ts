import { type Locator, type Page } from '@playwright/test';
import { MendixWidget } from './MendixWidget';

//Helper utility class to work with Mendix datagrid widgets within a Playwright context
export class DatePicker extends MendixWidget {
    inputElement: Locator;

    constructor(page: Page, mxName: string, context?: Locator) {
        super(page, mxName, context);
        this.inputElement = this.locate().locator('input');        
    }

    async setValue(value: Date, dateFormat: string) {
        const inputText = formatDateTime(value,dateFormat);

        await this.inputElement.click();
        await this.inputElement.fill(inputText);
    }

    getValue() {
        this.inputElement.inputValue();
    }

}

function formatDateTime(date: Date, dateFormat: string): string {   

    //extracting parts of date string
    const day = date.getDate();
    const month = date.getMonth() + 1;
    const year = date.getFullYear();    
    const hour = date.getHours();
    const minute = date.getMinutes();
    const second = date.getSeconds();
    const millisecond = date.getMilliseconds();

    //to replace month
    dateFormat = dateFormat.replace("MM", month.toString().padStart(2,"0"));        

    //to replace year
    if (dateFormat.indexOf("yyyy") > -1) {
        dateFormat = dateFormat.replace("yyyy", year.toString());
    } else if (dateFormat.indexOf("yy") > -1) {
        dateFormat = dateFormat.replace("yy", year.toString().substr(2,2));
    }

    //to replace day
    dateFormat = dateFormat.replace("dd", day.toString().padStart(2,"0"));

    //to replace hours
    dateFormat = dateFormat.replace("HH", hour.toString().padStart(2,"0"));

    //to replace minutes
    dateFormat = dateFormat.replace("mm", minute.toString().padStart(2,"0"));

    //to replace seconds
    dateFormat = dateFormat.replace("ss", second.toString().padStart(2,"0"));

    //to replace milliseconds
    dateFormat = dateFormat.replace("SSS", millisecond.toString().padStart(2,"0"));

    return dateFormat;
}
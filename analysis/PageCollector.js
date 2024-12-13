const Page = require("../MxModel/Page");

module.exports = class PageCollector {
    constructor(modelQuality) {
        this.modelQuality = modelQuality;
    }

    collect(promises) {
        let pages = this.modelQuality.model.allPages();
        pages.forEach(pageIF => {
            promises.push(new Promise((resolve, reject) => {
                pageIF.load().then(page=>{
                    let container = page.container.id.toString('base64');
                    let MxPage = Page.parse(page, container);
                    this.modelQuality.MxModel.pages.push(MxPage);
                    resolve();
                }).catch(err => {console.log(err)})
            }));
        });
    }
}

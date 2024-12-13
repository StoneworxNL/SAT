const Folder = require("../MxModel/Folder");

module.exports = class FolderCollector {
    constructor(modelQuality) {
        this.modelQuality = modelQuality;
    }

    collect(promises) {
        let folders = this.modelQuality.model.allFolders();
        folders.forEach(folderIF => {
            promises.push(new Promise((resolve, reject) => {
                let newFolder = new Folder(folderIF['id'], folderIF['container']['id'], folderIF['name']);
                this.modelQuality.MxModel.folders[newFolder.id] = newFolder;
                resolve();
            }))
        });
    }
}

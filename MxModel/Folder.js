class Folder{
    constructor(id, container, name) {
        this.id = id;
        this.container = container;
        this.name = name
    }

    static builder(folders){
        let folderMap = {};
        folders.forEach(folder =>{
            let [id, folderData] = folder;
            folderMap[id] =  new Folder(folderData.id, folderData.container, folderData.name);

        })
        return folderMap;
    }

    static parse (doc, container) {
        let name = doc['Name'];
        let id = doc['$ID'].toString('base64');
        return new Folder(id, container.toString('base64'), name)
    }
}

module.exports = Folder;
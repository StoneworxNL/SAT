class MxModelObject {
   
    // static findKey(doc, keyName) {
    //     const obj = Object.keys(doc).find(key => key.toLowerCase() === keyName.toLowerCase());
    //     return obj ? doc[obj] : null;
    // }


    static findKey(doc, ...keyNames) {
        if (keyNames.length === 0) {
            return null;
        }
    
        const keyName = keyNames[0];
        const obj = Object.keys(doc).find(key => key.toLowerCase() === keyName.toLowerCase());
        if (!obj) { return null};
        const result = doc[obj];
        if (keyNames.length === 1) {
            return result;
        } else {
            return this.findKey(result, ...keyNames.slice(1));
        }
    }
}

module.exports = MxModelObject;
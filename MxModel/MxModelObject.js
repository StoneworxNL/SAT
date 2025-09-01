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
        let obj = Object.keys(doc).find(key => key.toLowerCase() === keyName.toLowerCase());
        if (!obj) {
            obj = keyName;
        }
        const result = doc[obj];
        if (result === undefined || result === null) { return null; }
        if (keyNames.length === 1) {
            return result;
        } else {
            return this.findKey(result, ...keyNames.slice(1));
        }
    }

    static binaryToUUID(idBuffer){        
        let uint8Array = new Uint8Array(idBuffer.buffer.length);
        idBuffer.buffer.map((value, index) => {
            uint8Array[index] = value;
        });
        return MxModelObject.uint8ArrayToUUID(uint8Array);
    }

    static uint8ArrayToUUID(uint8Array) {
        if (!(uint8Array instanceof Uint8Array) || uint8Array.length !== 16) {
            throw new Error("Input must be a Uint8Array of length 16");
        }

        const hex = [...uint8Array].map(b => b.toString(16).padStart(2, '0'));

        // Apply little-endian conversion to the first three fields
        const timeLow = hex.slice(0, 4).reverse().join('');
        const timeMid = hex.slice(4, 6).reverse().join('');
        const timeHiAndVersion = hex.slice(6, 8).reverse().join('');

        // Remaining fields are big-endian
        const clockSeq = hex.slice(8, 10).join('');
        const node = hex.slice(10, 16).join('');

        return `${timeLow}-${timeMid}-${timeHiAndVersion}-${clockSeq}-${node}`;
    }
}
module.exports = MxModelObject;
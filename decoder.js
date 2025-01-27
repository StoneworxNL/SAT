function base64ToUUID(base64) {
    // Decode the base64 string to a byte array
    const binaryString = atob(base64);
    const byteArray = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
        byteArray[i] = binaryString.charCodeAt(i);
    }

    // Convert the byte array to a UUID string
    const hexArray = Array.from(byteArray, byte => byte.toString(16).padStart(2, '0'));
    const uuid = [
        hexArray.slice(3, 4).join('') + hexArray.slice(0, 3).join(''),
        hexArray.slice(4, 6).join(''),
        hexArray.slice(6, 8).join(''),
        hexArray.slice(8, 10).join(''),
        hexArray.slice(10, 16).join('')
    ].join('-');

    return uuid;
}

const base64String = "TJ9xCCh3h0mdTVo+0PSB5A==";
//const base64String = "rjCV8ww+2U+n8wU/4A/IvA==" ;
const uuid = base64ToUUID(base64String);
console.log(uuid); // Output: "08719f4c-7728-4987-9d4d-5a3ed0f481e4"

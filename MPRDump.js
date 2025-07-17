const { BSON, EJSON, ObjectId, UUID } = require('bson');
const sqlite3 = require('sqlite3').verbose();
const MxModel = require("./MxModel/MxModel");

class MPRDump {
    constructor(mpr) {
        this.mpr = mpr;
        this.contents = [];
    }

    collect() {
        const db = new sqlite3.Database(this.mpr);
        return new Promise((resolve, reject) => {
            db.serialize(() => {
                db.each("SELECT UnitID, ContainerID as container, ContainmentName, Contents as contents from Unit", (err, row) => {
                    if (err) {
                        console.log(err.message)
                    };
                    const doc = BSON.deserialize(row.contents);
                    this.contents.push(doc);
                }, () => {

                    resolve(this.contents);
                });
            });
            db.close();
        })
    }
}

module.exports = MPRDump;


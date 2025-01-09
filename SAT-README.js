"use strict";

const { program: commander } = require('commander');

const Quality = require("./SAT-Analysis/Quality.js");

commander
    .version('1.0.0', '-v, --version')
    .parse();
const options = commander.opts();

main();

function main() {
    let analysis = new Quality();
    analysis.logErrorCodes();

}

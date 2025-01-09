const fs = require('fs');
const config = require("config");
const readline = require('readline');
const { program: commander } = require('commander');

commander
    .version('1.0.0', '-v, --version')
    .usage('[OPTIONS]...')
    .requiredOption('-1, --first <filename>', 'Filename of 1st file to compare')
    .requiredOption('-2, --second <filename>', 'Filename of 1st file to compare')
    .requiredOption('-o, --output <filename>', 'Filename of output file')
    .parse();

const options = commander.opts();
let folder = config.get("outputFolder");
let fileA = options.first;
let fileB = options.second;
let fileOut = folder+'/'+options.output;
let listA = [];
let listB = [];

function readFile(fname, list, callBack){
    var lineReader = require('readline').createInterface({
        input: require('fs').createReadStream(fname)
      });
      
      lineReader.on('line', function (line) {
        list.push(line);
      });
      
      lineReader.on('close', function () {
          callBack();
      });
}

readFile(fileA, listA, read2ND);

function read2ND(){
    readFile(fileB, listB, sort)
}

function sort(){
    let listASorted = listA.sort();
    let listBSorted = listB.sort();
    diff(listASorted,listBSorted);
}

function diff(listASorted, listBSorted){
    let indexA = 0; let indexB = 0;
    fs.writeFileSync(fileOut, `diff: ${fileA} <-> ${fileB}\n`);
    while (indexA <= listASorted.length || indexB <= listBSorted.length){
        let valueA = listASorted[indexA];
        let valueB = listBSorted[indexB];
        if (valueA == valueB){
            indexA++;indexB++;
        } else if (valueA > valueB || !valueA){
            fs.appendFileSync(fileOut, `> ${indexB} - ${valueB} \n`);
            indexB++;
        } else if (valueA < valueB || ! valueB){
            fs.appendFileSync(fileOut,`< ${indexA} - ${valueA} \n`);
            indexA++;
        } else {
            console.log("this is weird")
            console.log(`XX${valueA}XX - XX${valueB}XX`)
        }
    }
    console.log("done");
}
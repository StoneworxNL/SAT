const mendixplatformsdk_1 = require("mendixplatformsdk");
const fs = require("fs");

exports.loadWorkingCopy = function (appID, nickname, branch, clear) {
    workingCopyFile = nickname + '.workingcopy'; //beetje ugly: global variabele keertje fixen
    return new Promise((resolve, reject) => {
        const client = new mendixplatformsdk_1.MendixPlatformClient();
        if (clear) {
            wcFile = "";
            wcID = "";   
        } else readWorkingCopyFile(appID, workingCopyFile, branch);
        console.log(`GET APP: ${appID}-${branch}`);
        app = client.getApp(appID);
        console.log(`LOADING: ${appID}-${branch}`);
        loadModel(app, appID, branch)
            .then(([model, workingCopy]) => {
                resolve([model, workingCopy]);
            }).catch((err) => {
                console.log(err.message)
            });

    })
};

exports.commitWorkingCopy = async function (branch, workingCopy, model) {
    let token = process.env.MENDIX_TOKEN;
    mendixplatformsdk_1.setPlatformConfig({ mendixToken: token });
    mendixplatformsdk_1.enableLogger();
    const client = new mendixplatformsdk_1.MendixPlatformClient();
    await model.flushChanges(async function () {
        console.log('Commit: ' + branch);
        try {
            await workingCopy.commitToRepository(branch, { commitMessage: "SAT check run" });
        } catch (e) {
            console.error(e);
        }
    });
};

function readWorkingCopyFile(appID, workingCopyFile, branch) {
    try {
        wcFile = fs.readFileSync(workingCopyFile).toString();
        appID = wcFile.split(':')[0];
        branch = wcFile.split(':')[1];
        wcID = wcFile.split(':')[2];
    }
    catch {
        wcFile = "";
        wcID = "";
        if (appID === "") {
            console.error("Need an appID on the command line if no workingcopy file is present for the nickname");
            return;
        }
    }
}

function loadModel(app, appID, branch) {
    let workingCopy;
    return new Promise((resolve, reject) => {
        if (wcID != "") {
            console.log("Opening existing working copy: " + wcID);
            workingCopy = app.getOnlineWorkingCopy(wcID);
            workingCopy.openModel()
                .then((model) => {
                    console.log("Resolve existing model");
                    resolve([model, workingCopy]);
                }).catch((err) => {
                    console.log(`Failed to get existing working copy ${wcID}: ${err.message}`);
                    wcID = "";
                    loadModel(app, appID, branch);
                });
        }
        if (wcID === "") {
            let repository = app.getRepository();
            console.log("Download workingcopy");

            app.createTemporaryWorkingCopy(branch)
                .then((workingCopy) => {
                    wcID = workingCopy.workingCopyId;
                    fs.writeFileSync(workingCopyFile, `${appID}:${branch}:${wcID}`);
                    workingCopy.openModel().then((model) => {
                        console.log("Resolve downloaded model for " + branch);
                        resolve([model, workingCopy]);
                    }).catch((err) => { console.log(err) });
                }).catch((err) => { console.log(err) });

        }
    });
}
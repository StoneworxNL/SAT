const mendixplatformsdk_1 = require("mendixplatformsdk");
const fs = require("fs");

exports.loadWorkingCopy = function (appID, nickname, branch) {
    workingCopyFile = nickname + '.workingcopy';
    return new Promise((resolve, reject) => {
        const client = new mendixplatformsdk_1.MendixPlatformClient();
        readWorkingCopyFile(appID,workingCopyFile, branch);
        app = client.getApp(appID);
        loadModel(app, appID, branch).then((model) => {
            resolve(model);
        });

    })
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
    return new Promise((resolve, reject) => {
        if (wcID != "") {
            try {
                console.log("Opening existing working copy: " + wcID);
                workingCopy = app.getOnlineWorkingCopy(wcID);
                workingCopy.openModel().then((model) => {
                    console.log("Resolve existing model");
                    resolve(model);
                });
            }
            catch (e) {
                console.log(`Failed to get existing working copy ${wcID}: ${e}`);
                wcID = "";
            }
        }
        if (wcID === "") {
            const repository = app.getRepository();
            console.log("Download workingcopy");
            if ((branch === "") || (branch === "trunk") || (branch === "main")) {
                repository.getInfo((repositoryInfo) => {
                    if (repositoryInfo.type === "svn")
                        resolve("trunk");
                    else
                        resolve("main");
                }).then((branch) => {
                    app.createTemporaryWorkingCopy(branch).then((workingCopy) => {
                        wcID = workingCopy.workingCopyId;
                        fs.writeFileSync(workingCopyFile, `${appID}:${useBranch}:${wcID}`);
                        workingCopy.openModel().then((model) => {
                            console.log("Resolve downloaded model for main/trunk");
                            resolve(model);
                        });
                    });
                })
            } else {
                app.createTemporaryWorkingCopy(branch).then((workingCopy) => {
                    wcID = workingCopy.workingCopyId;
                    fs.writeFileSync(workingCopyFile, `${appID}:${branch}:${wcID}`);
                    workingCopy.openModel().then((model) => {
                        console.log("Resolve downloaded model for " + branch);
                        resolve(model);
                    });
                });
            }
        }
    });
}
const Security = require("../MxModel/Security");
const UserRole = require('../MxModel/UserRole');

class SecurityCollector {
    constructor(modelQuality) {
        this.modelQuality = modelQuality;
    }

    collect(promises) {
        let securities = this.modelQuality.model.allProjectSecurities();
        securities.forEach((securityIF) => {
            promises.push(new Promise((resolve, reject) => {
                if (securityIF.structureTypeName === 'Security$ProjectSecurity') {
                    securityIF.load().then((security) => {
                        //                        this.modelQuality.security.enableDemoUsers = security.enableDemoUsers;    
                        let mxSecurity = new Security(security.enableDemoUsers);
                        let userRoles = security['userRoles'];
                        mxSecurity.roles = userRoles.flatMap(userRole => {
                            if (typeof userRole === 'object') {
                                let name = userRole['name'];
                                let moduleRoles = userRole['moduleRoles'].flatMap(moduleRole => {
                                    if (typeof moduleRole === 'object') {
                                        return moduleRole ? moduleRole['name']: [];
                                    } return [];
                                })
                                return new UserRole(name, moduleRoles)
                            } return [];
                        })
                        this.modelQuality.MxModel.security = mxSecurity;
                        resolve();
                    })
                } else resolve();
            }))
        });
    }
}

module.exports = SecurityCollector;

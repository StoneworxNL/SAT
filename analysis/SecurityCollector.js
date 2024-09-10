module.exports = class SecurityCollector {
    constructor(modelQuality) {
        this.modelQuality = modelQuality;
    }

    collect(promises) {
        let securities = this.modelQuality.model.allProjectSecurities();
        securities.forEach((securityIF) => {
            promises.push(new Promise((resolve, reject) => {
                if (securityIF.structureTypeName === 'Security$ProjectSecurity') {
                    securityIF.load().then((security) => {
                        this.modelQuality.security.enableDemoUsers = security.enableDemoUsers;
                        resolve();
                    })
                } else resolve();
            }))
        });
    }
}

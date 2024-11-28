const UserRole = require('./UserRole');

class Security {
    constructor(enableDemoUsers) {
        this.enableDemoUsers = enableDemoUsers,
        this.roles = [];
    }

    static builder(obj){
        let security = new Security(obj.enableDemoUsers);
        let roles = obj.roles.map(role => new UserRole(role.name, role.moduleRoles));
        security.roles = roles;
        return security;
    }

    static parse(doc) {
        let security = new Security(doc['EnableDemoUsers']);
        let userRoles = doc['UserRoles'];
        security.roles = userRoles.flatMap(userRole =>{
            if (typeof userRole ==='object'){
                let name = userRole['Name'];                
                let moduleRoles = userRole['ModuleRoles'].flatMap(moduleRole=>{
                    if (typeof moduleRole ==='string'){
                        return moduleRole
                    } return [];
                })
                return new UserRole(name, moduleRoles)
            } return [];
        })
        return security;
    }

}

module.exports = Security;
const MxModelObject = require('./MxModelObject');
const UserRole = require('./UserRole');


class Security extends MxModelObject {
    constructor(enableDemoUsers) {
        super();
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
        let enableDemoUsers = Security.findKey(doc, 'EnableDemoUsers');
        let security = new Security(enableDemoUsers);
        let userRoles = Security.findKey(doc,'userRoles');
        security.roles = userRoles.flatMap(userRole =>{
            if (typeof userRole ==='object'){
                let name = Security.findKey(userRole, 'Name');
                let moduleRoles = Security.findKey(userRole, 'ModuleRoles').flatMap(moduleRole=>{
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
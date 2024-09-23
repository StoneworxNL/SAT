class Action{
    constructor(Type, ID, IsCommit, Complexity) {
        this.type = Type;
        this.id = ID.toString('base64');
        this.isCommit = IsCommit;
        this.complexity = Complexity;
    }
}

class JavaAction extends Action{
    constructor(Type, ID, ErrorHandling, JavaActionName) {
        super(Type, ID);
        this.errorHandling = ErrorHandling;
        this.javaActionName = JavaActionName;
    }
}

module.exports = {Action, JavaAction};
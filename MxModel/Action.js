class Action{
    constructor(Type, ID, commitVariable) {
        this.type = Type;
        this.id = ID.toString('base64');
        this.commitVariable = commitVariable;
    }
}

class JavaAction extends Action{
    constructor(Type, ID, ErrorHandling, JavaActionName) {
        super(Type, ID);
        this.errorHandling = ErrorHandling;
        this.javaActionName = JavaActionName;
    }
}

class ExpressionAction extends Action{
    constructor(Type, ID, IsCommit, Complexity, Caption) {
        super(Type, ID);
        this.isCommit = IsCommit;
        this.complexity = Complexity;
        this.caption = Caption;
    }
}

module.exports = {Action, JavaAction, ExpressionAction};
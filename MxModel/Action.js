class Action{
    constructor(Type, ID, variableName) {
        this.type = Type;
        this.id = ID.toString('base64');
        this.variableName = variableName;
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
    constructor(Type, ID, IsCommit, Complexity, Caption, Expression, Assignments, Entity) {
        super(Type, ID);
        this.isCommit = IsCommit;
        this.complexity = Complexity;
        this.caption = Caption;
        this.expression = Expression;
        this.assignments = Assignments;
        this.entity =Entity;
    }
}

module.exports = {Action, JavaAction, ExpressionAction};
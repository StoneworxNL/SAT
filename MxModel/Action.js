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

class ReturnEntityAction extends Action{ // Action that returns a single object or a list of objects
    constructor(Type, ID, VariableName, Entity) {
        super(Type, ID, VariableName);
        this.entity =Entity;
    }
}

class ReturnEnumAction extends Action{ // Action that returns a single object or a list of objects
    constructor(Type, ID, VariableName,  Enum) {
        super(Type, ID, VariableName);
        this.enum = Enum;
    }
}

class ReturnPrimitiveAction extends Action{ // Action that returns a single object or a list of objects
    constructor(Type, ID, VariableName,  VariableType) {
        super(Type, ID, VariableName);
        this.variableType = VariableType;
    }
}
module.exports = {Action, JavaAction, ExpressionAction, ReturnEntityAction: ReturnEntityAction, ReturnEnumAction, ReturnPrimitiveAction};
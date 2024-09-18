class Action{
    constructor(Type, ID, IsCommit, Complexity) {
        this.type = Type;
        this.id = ID;
        this.isCommit = IsCommit;
        this.complexity = Complexity;
    }
}

module.exports = Action;
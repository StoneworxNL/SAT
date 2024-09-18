class Flow{
    constructor(OriginPointer, DestinationPointer, IsErrorHandler, FlowValue) {
        this.origin = OriginPointer;
        this.destination = DestinationPointer;
        this.isErrorHandler = IsErrorHandler;
        this.flowValue = FlowValue
    }
}

module.exports = Flow;
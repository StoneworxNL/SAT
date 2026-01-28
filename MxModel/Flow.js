class Flow{
    constructor(OriginPointer, DestinationPointer, OriginIndex, DestinatonIndex, IsErrorHandler, FlowValue) {
        this.origin = OriginPointer;
        this.destination = DestinationPointer;
        this.isErrorHandler = IsErrorHandler;
        this.OriginIndex = OriginIndex;
        this.DestinatonIndex = DestinatonIndex;
        this.flowValue = FlowValue
    }
}

module.exports = Flow;
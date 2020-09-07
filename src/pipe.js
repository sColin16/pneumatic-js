// The base class for objects that can use the append methods for the pipes
class HandledObject {
    getHandle(senderHandle) {
        return this;
    }
}

// Note: this class isn't instantiated
class PipeBuilder {
    static addInterfaceMethod(pipeClass, interfaceClass, methodName, operationCollection) {
        pipeClass.verifyInterfaceClass(interfaceClass);

        pipeClass.prototype[methodName] =
            this.interfaceMethodFactory(interfaceClass, methodName,
                operationCollection);        

        for (const [name, operation] of Object.entries(operationCollection.validOperations)) {
            let operationName = operation.getOperationName(methodName);

            pipeClass.prototype[operationName] = operation.getDefaultOperation();
        }
    }

    static interfaceMethodFactory(interfaceClass, methodName, operationCollection) {
        let operationCollectionFunction =
            operationCollection.operationCollectionFactory(methodName,
                interfaceClass.name);

        function finalOperationCollection(senderHandle, ...args) {
            this.verifyFlow(senderHandle, interfaceClass);

            return operationCollectionFunction.bind(this)(senderHandle, ...args);
        }

        let namedFunction = Object.defineProperty(finalOperationCollection, 'name',
            {value: methodName, configurable: true});

        return namedFunction
    }
}

// Responsible for connecting pipes to create a pipeline
class PipeWelder {
    static appendToPipeline(pipe, interfaceClass, object) {
        const pipelineEnd = pipe.getPipelineEnd(interfaceClass);

        if (this.isPipelineableObject(object)) {
            const targetPipe = object.getPipelineEnd(object.constructor.getOppositeInterface(interfaceClass));

            this.weldPipes(pipelineEnd, interfaceClass, targetPipe);

        } else if (this.isHandledObject(object)) {
            this.weldHandledObject(pipelineEnd, interfaceClass, object);

        } else {
            this.weldObject(pipelineEnd, interfaceClass, object);
        }
    }

    static weldHandledObject(pipelineEnd, interfaceClass, handledObject) {
        const targetHandle = handledObject.getHandle(pipelineEnd);

        if (this.isPipelineableObject(targetHandle)) {
            this.weldPipes(pipelineEnd, interfaceClass, targetHandle);

        } else {
            this.weldObject(pipelineEnd, interfaceClass, targetHandle);
        }
    }

    static weldPipes(pipelineEnd, interfaceClass, targetPipe) {
        const oppositeInterface = pipelineEnd.constructor.getOppositeInterface(interfaceClass);

        this.weldObject(pipelineEnd, interfaceClass, targetPipe);
        this.weldObject(targetPipe, oppositeInterface, pipelineEnd);
    }

    static weldObject(pipelineEnd, interfaceClass, object) {
        pipelineEnd.setDirectHandle(interfaceClass, object);
    }

    // Returns true if the object implements the getHandle() method
    static isHandledObject(object){
        return 'getHandle' in object;
    }

    // Returns true if the object is handled, and implements the appendToPipeline() method
    static isPipelineableObject(object) {
        return 'getPipelineEnd' in object;
    }
}

class Pipe {
    static builder = PipeBuilder; // Class that dynamically adds methods and other properties
    static welder = PipeWelder;   // Class that connects pipes to form complete pipelines

    constructor(firstHandle, secondHandle) {
        this.constructor.verifyInterfacesDefined();

        this.handles = {
            // Read the interface names from the static properties
            [this.constructor.FIRST_INTERFACE.name]:  firstHandle,
            [this.constructor.SECOND_INTERFACE.name]: secondHandle,
        }
    }

    verifyHandlesDefined() {
        for (const [key, value] of Object.entries(this.handles)) {
            if (typeof value === 'undefined') {
                throw new Error(`The handle for interface ${key} is not defined`);
            }
        }
    }

    verifySenderHandle(senderHandle, interfaceClass) {
        let oppositeInterface = this.constructor.getOppositeInterface(interfaceClass);

        if (senderHandle != this.handles[oppositeInterface.name]) {
            throw new Error(`Invalid sender. ${senderHandle} cannot send messages through ` +
                `this pipe to the interface ${interfaceClass.name}`);
        }
    }

    getPipelineEnd(interfaceClass) {
        let directHandle = this.getDirectHandle(interfaceClass);

        if (typeof directHandle === 'undefined') {
            return this;

        } else if (this.constructor.welder.isPipelineableObject(directHandle)) {
            return directHandle.getPipelineEnd(interfaceClass);

        } else {
            throw new Error(`The ${interfaceClass.name} end of the pipeline is already welded`);
        }
    }

    // Returns the object stored in the handle for the given interface class
    getDirectHandle(interfaceClass) {
        return this.handles[interfaceClass.name];
    }

    // Links a given object to the handle for the provided interface class
    setDirectHandle(interfaceClass, object) {
        this.handles[interfaceClass.name] = object;
    }

    appendToPipeline(interfaceClass, object) {
        this.constructor.welder.appendToPipelinee(this, interfaceClass, object);
    }

    verifyFlow(senderHandle, interfaceClass) {
        this.verifyHandlesDefined();
        this.verifySenderHandle(senderHandle, interfaceClass);
    }

    static verifyInterfacesDefined() {
        if (typeof this.FIRST_INTERFACE === 'undefined' ||
                typeof this.SECOND_INTERFACE === 'undefined') {

            throw new Error(`One or more of the interfaces are not defined for ` +
                `${this.name}`);
        }
    }

    static verifyInterfaceClass(interfaceClass) {
        this.verifyInterfacesDefined();

        if (interfaceClass != this.FIRST_INTERFACE &&
            interfaceClass != this.SECOND_INTERFACE) {

            throw new Error(`${interfaceClass.name} is not a valid interface for ${this.name}`)
        }
    }

    static getOppositeInterface(interfaceClass) {
        this.verifyInterfaceClass(interfaceClass);

        if (interfaceClass == this.FIRST_INTERFACE) {
            return this.SECOND_INTERFACE;
        }

        if (interfaceClass === this.SECOND_INTERFACE) {
            return this.FIRST_INTERFACE;
        }
    }

    static addInterfaceMethod(interfaceClass, methodName, operationCollection) {
        this.builder.addInterfaceMethod(this, interfaceClass, methodName, operationCollection);
    }
}

export { HandledObject, PipeBuilder, PipeWelder, Pipe }

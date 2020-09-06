// The base class for objects that can use the append methods for the pipes
class HandledObject {
    getHandle(senderHandle, ...args) {
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
    // Returns true if the object implements the getHandle() method
    static isHandledObject(object){
        return 'getHandle' in object;
    }

    // Returns true if the object is handled, and implements the appendToPipeline() method
    static isPipelineableObject(object) {
        return this.isHandledObject(object) && 'appendToPipeline' in object;
    }
}

class Pipe extends HandledObject {
    static builder = PipeBuilder; // Class that dynamically adds methods and other properties
    static welder = PipeWelder;

    constructor(firstHandle, secondHandle) {
        super();

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

    getHandle(senderHandle, interfaceClass) {
        let directHandle = this.getDirectHandle(interfaceClass);

        if (typeof directHandle === 'undefined') {
            return this;
        } else if (this.constructor.welder.isPipelineableObject(directHandle)) {
            return directHandle.getHandle(senderHandle, interfaceClass);
        } else {
            throw new Error(`Cannot get handle for the pipeline. Pipeline is already fully connected`);
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

    appendToPipeline() {
        // TODO
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

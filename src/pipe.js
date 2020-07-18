// The base class for objects that can use the append methods for the pipes
class HandledObject {
    getHandle(senderHandle) {
        return this;
    }
}

// Note: this class isn't instantiated
class PipeBuilder {
    static addInterfaceMethod(className, methodName, interfaceName, operationCollection) {
        className.verifyInterfaceName(interfaceName);

        className.prototype[methodName] =
            this.interfaceMethodFactory(methodName, interfaceName,
                operationCollection);        

        for (const [name, operation] of Object.entries(operationCollection.validOperations)) {
            let operationName = operation.getOperationName(methodName);

            className.prototype[operationName] = operation.getDefaultOperation();
        }
    }

    static interfaceMethodFactory(methodName, interfaceName, operationCollection) {
        let operationCollectionFunction =
            operationCollection.operationCollectionFactory(methodName,
                interfaceName);

        function finalOperationCollection(senderHandle, ...args) {
            this.verifyFlow(senderHandle, interfaceName);

            return operationCollectionFunction.bind(this)(senderHandle, ...args);
        }

        let namedFunction = Object.defineProperty(finalOperationCollection, 'name',
            {value: methodName, configurable: true});

        return namedFunction
    }
}

class Pipe extends HandledObject {
    static builder = PipeBuilder; // Class that dynamically adds methods and other properties

    constructor(firstHandle, secondHandle) {
        super();

        this.verifyInterfacesDefined();

        this.handles = {
            // Read the interface names from the static properties
            [this.constructor.FIRST_INTERFACE_NAME]:  firstHandle,
            [this.constructor.SECOND_INTERFACE_NAME]: secondHandle,
        }
    }

    verifyInterfacesDefined() {
        if (typeof this.constructor.FIRST_INTERFACE_NAME === 'undefined' ||
                typeof this.constructor.SECOND_INTERFACE_NAME === 'undefined') {

            throw new Error(`One or more of the interface names isn't defined for ` +
                `${this.constructor.name}`);
        }
    }

    verifyHandlesDefined() {
        for (const [key, value] of Object.entries(this.handles)) {
            if (typeof value === 'undefined') {
                throw new Error(`The handle for interface ${key} is not defined`);
            }
        }
    }

    verifySenderHandle(senderHandle, interfaceName) {
        let oppositeInterfaceName = this.constructor.getOppositeInterfaceName(interfaceName);

        if (senderHandle != this.handles[oppositeInterfaceName]) {
            throw new Error("Sender handle does not match the sender for this pipe and method");
        }
    }

    verifyFlow(senderHandle, interfaceName) {
        this.constructor.verifyInterfaceName(interfaceName);
        this.verifyHandlesDefined();
        this.verifySenderHandle(senderHandle, interfaceName);
    }

    static verifyInterfaceName(interfaceName) {
        if (interfaceName != this.FIRST_INTERFACE_NAME &&
            interfaceName != this.SECOND_INTERFACE_NAME) {

            throw new Error(`${interfaceName} is not a valid interface for ${this.name}`)
        }
    }

    static getOppositeInterfaceName(interfaceName) {
        this.verifyInterfaceName(interfaceName);

        if (interfaceName == this.FIRST_INTERFACE_NAME) {
            return this.SECOND_INTERFACE_NAME;
        }

        if (interfaceName === this.SECOND_INTERFACE_NAME) {
            return this.FIRST_INTERFACE_NAME;
        }
    }

    static addInterfaceMethod(methodName, interfaceName, operationCollection) {
        this.builder.addInterfaceMethod(this, methodName, interfaceName, operationCollection);
    }
}

export { HandledObject, PipeBuilder, Pipe }

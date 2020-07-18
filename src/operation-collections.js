import { OnewayFilter, OnewayTransform, TwowayRequestTransform, TwowayResponseTransform }
    from './operations.js'

// Stores a combination of operations that can be applied to a method
class OperationCollection {
    static validOperations = {} // Should be a dictionary of (string, Operation) pairs

    // Returns a function that defines how the actual collection of operations is run
    // Note that the function returned and 'this' within the function are bound
    // to a Pipe instance
    static operationCollectionFactory(methodName, interfaceName) {
        throw new Error(`operationCollectionFactory not defined for ${this.name}`);
    }
}

// If you need to expand the functionality of this collection, just use
// composition, and wrap the function returned by this factory

// Class defining operations for oneway interfaces
// Allows for transformation and filtering of the oneway message
class OnewayCollection extends OperationCollection {
    static validOperations = {
        'filter': OnewayFilter,
        'transform': OnewayTransform
    }
    
    static operationCollectionFactory(methodName, interfaceName) {
        let filterOperation = this.validOperations['filter'];
        let transformOperation = this.validOperations['transform'];

        let filterName = filterOperation.getOperationName(methodName);
        let transformName = transformOperation.getOperationName(methodName);

        function onewayCollection(senderHandle, ...args) {
            let shouldFilter = this[filterName](...args);

            if (!shouldFilter) {
                let transformedArgs = this[transformName](...args);

                transformOperation.verifyOutput(args, transformedArgs, transformName, this); 

                this.handles[interfaceName][methodName](this, ...transformedArgs);
            }
        }

        return onewayCollection;
    }
}

// Class defining operations for twoway interfaces (non-void functions)
// Allows transforming the messages send both ways
class TwowayCollection extends OperationCollection {
    static validOperations = {
        'requestTransform': TwowayRequestTransform,
        'responseTransform': TwowayResponseTransform
    }

    static operationCollectionFactory(methodName, interfaceName) {
        let requestTransformOperation = this.validOperations['requestTransform'];
        let responseTransformOperation = this.validOperations['responseTransform'];

        let requestTransformName = requestTransformOperation.getOperationName(methodName);
        let responseTransformName = responseTransformOperation.getOperationName(methodName);

        function twowayCollection(senderHandle, ...args) {
            let transformedRequest = this[requestTransformName](...args);

            requestTransformOperation.verifyOutput(args, transformedRequest,
                requestTransformName, this);

            let response = this.handles[interfaceName][methodName](this, ...transformedRequest);

            let transformedResponse = this[responseTransformName](response);

            return transformedResponse;
        }

        return twowayCollection;
    }
}

export{ OperationCollection, OnewayCollection, TwowayCollection }

// Definition of operations that can be applied to an interface
// They also define the name that should be used for performing the operation
// and a default operation that can be used if the user does not override the
// operation method
class Operation {
    static upperCaseMethodName(methodName) {
        let upperCaseMethodName = methodName[0].toUpperCase() + methodName.slice(1)

        return upperCaseMethodName;
    }

    static getOperationName(methodName) {
        if (typeof this.PREFIX === 'undefined') {
            throw new Error(`PREFIX not set and getOperationName not overridden ` +
                `for ${this.constructor.name}`);
        }

        return this.PREFIX + this.upperCaseMethodName(methodName);
    }

    static getDefaultOperation() {
        throw new Error(`getDefaultOperation is not defined for ${this.constructor.name}`);
    }
}

// Base class for transforming arguments of a function
// Operation function should return an array of transformed argument
// (If there is only one argument, return a single-element array)
class ArgumentTransform extends Operation {
    static getDefaultOperation() {
        return function defaultArgumentTransform(...args) {
            return args;
        }
    }

    static verifyOutput(inputArgs, transformedArgs, transformName, pipeReference) {
        this.verifyTransformedArgsIsIterator(transformedArgs, transformName, pipeReference);

        this.warnOnArgCountMismatch(inputArgs, transformedArgs, transformName, pipeReference);
    }

    static verifyTransformedArgsIsIterator(transformedArgs, transformName, pipeReference) {
        if (typeof transformedArgs[Symbol.iterator] !== 'function') {
            throw new Error (`${pipeReference.constructor.name}.${transformName} did not ` +
                `return an iterable. Return a list of transformed arugments, even ` +
                `if the function only accepts a single argument`)
        }
    }

    static warnOnArgCountMismatch(inputArgs, transformedArgs, transformName, pipeReference) {
        if (transformedArgs.length != inputArgs.length) {
            console.warn(`Argument number mismatch. ${inputArgs.length} arguments were ` +
                `passed to ${pipeReference.constructor.name}.${transformName}, but `+
                `the function only returned ${transformedArgs.length} arguments`);
        }
    }
}

// Argument transform for void interface methods
class OnewayTransform extends ArgumentTransform {
    static PREFIX = 'transform';
}

// For preventing the delivery of a message passed via a void function
// Operation function should return a boolean
class OnewayFilter extends Operation {
    static PREFIX = 'filter';

    static getDefaultOperation() {
        return function defaultOnewayFilter() {
            return false;
        }
    }
}

// Arugment transform for non-void interface methods
class TwowayRequestTransform extends ArgumentTransform {
    static PREFIX = 'transformRequest'
}

// Transforming the return value of a non-void interface method
class TwowayResponseTransform extends Operation {
    static PREFIX = 'transformResponse'

    static getDefaultOperation() {
        return function defaultTwowayResponseTransform(response) {
            return response;
        }
    }
}

export { Operation, ArgumentTransform, OnewayTransform, OnewayFilter,
    TwowayRequestTransform, TwowayResponseTransform}

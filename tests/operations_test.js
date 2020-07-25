import { 
    Pipe,
    Operation,
    ArgumentTransform,
    OnewayFilter,
    TwowayResponseTransform
} from "../index.js"

import {
    assertEquals,
    assertThrows,
    assertStringContains,
} from "https://deno.land/std/testing/asserts.ts";

import { stub } from "https://deno.land/x/mock/stub.ts"

class ValidPipeSubclass extends Pipe {
    static FIRST_INTERFACE = 'first';
    static SECOND_INTERFACE = 'second';
}

Deno.test("Upper Case Method Name", () => {
    const sampleMethodName = "myMethod";

    const expectedName = "MyMethod";
    const actualName = Operation.upperCaseMethodName(sampleMethodName);

    assertEquals(expectedName, actualName);
});

Deno.test("Get operation name throws error on undefined PREFIX", () => {
    class OperationSubclass extends Operation {};
    
    assertThrows(
        () => {OperationSubclass.getOperationName('myMethod')},
        Error,
        "PREFIX not set and getOperationName not overridden for OperationSubclass"
    )
});

Deno.test("Get operation name with defined PREFIX", () => {
    class OperationSubclass extends Operation {
        static PREFIX = "myPrefix";
    }

    const expectedOpName = "myPrefixMyMethod";
    const actualOpName = OperationSubclass.getOperationName("myMethod");

    assertEquals(expectedOpName, actualOpName);
});

Deno.test("Get default operation fails if not overridden", () => {
    class OperationSubclass extends Operation {};

    assertThrows(
        () => {OperationSubclass.getDefaultOperation()},
        Error,
        "getDefaultOperation is not defined for OperationSubclass"
    )
});

Deno.test("ArgumentTransform defaultOperation single argument", () => {
    const defaultOperation = ArgumentTransform.getDefaultOperation();

    const expectedOutput = [5];
    const actualOutput = defaultOperation(5);

    assertEquals(expectedOutput, actualOutput);
});

Deno.test("ArgumentTransform defaultOperation multiple arguments", () => {
    const defaultOperation = ArgumentTransform.getDefaultOperation();

    const expectedOutput = [7, 8, 9];
    const actualOutput = defaultOperation(7, 8, 9);

    assertEquals(expectedOutput, actualOutput);
});

Deno.test("ArgumentTransform verifyTransformedArgsIsIterator is iterator", () => {
    const transformedArgs = [1, 2, 3];
    const transformName = "myTransformFunction";
    const pipeReference = new ValidPipeSubclass();

    try {
        ArgumentTransform.verifyTransformedArgsIsIterator(transformedArgs, transformName,
            pipeReference);
    } catch(err) {
        assert(false, "Iterator check failed on a valid iterator");
    }
});

Deno.test("ArgumentTransform verifyTransformedArgsIsIterator is not iterator", () => {
    const transformedArgs = 1;
    const transformName = "myTransformFunction";
    const pipeReference = new ValidPipeSubclass();

    assertThrows(
        () => {ArgumentTransform.verifyTransformedArgsIsIterator(transformedArgs, transformName,
                pipeReference)},
        Error,
        "ValidPipeSubclass.myTransformFunction did not return an iterable"
    );
});

Deno.test("ArgumentTransform warns on argument count mismatch", () => {
    const inputArgs = [1, 2, 3];
    const transformedArgs = [2, 3, 4, 5];
    const transformName = "myTransformFunction";
    const pipeReference = new ValidPipeSubclass();

    const consoleWarnFake = stub(console, 'warn')

    ArgumentTransform.warnOnArgCountMismatch(inputArgs, transformedArgs, transformName,
        pipeReference);

    assertEquals(consoleWarnFake.calls.length, 1);
    assertStringContains(consoleWarnFake.calls[0].args[0], "3 arguments were passed to "+
        "ValidPipeSubclass.myTransformFunction, but the function returned 4");

    consoleWarnFake.restore();
});

Deno.test("ArgumentTransform doesn't warn on matching argument count", () => {
    const inputArgs = [1, 2, 3];
    const transformedArgs = [2, 3, 4];
    const transformName = "myTransformFunction";
    const pipeReference = new ValidPipeSubclass();

    const consoleWarnFake = stub(console, 'warn')

    ArgumentTransform.warnOnArgCountMismatch(inputArgs, transformedArgs, transformName,
        pipeReference);

    assertEquals(consoleWarnFake.calls.length, 0);

    consoleWarnFake.restore();
});

Deno.test("OnewayFilter default operation", () => {
    const defaultOperation = OnewayFilter.getDefaultOperation();

    const expectedOutput = false;
    const exampleInput = [1, 2, 3];
    const actualOutput = defaultOperation(...exampleInput);

    assertEquals(expectedOutput, actualOutput);
});

Deno.test("TwowayResponseTransform default operation", () => {
    const defaultOperation = TwowayResponseTransform.getDefaultOperation();

    const exampleInput = {a: 1, b: 2};
    const expectedOutput = {a: 1, b: 2};
    const actualOutput = defaultOperation(exampleInput);

    assertEquals(expectedOutput, actualOutput);
});

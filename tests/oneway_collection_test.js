import {
    Pipe,
    OnewayCollection,
} from "../index.js"

import {
    assertEquals,
    assertThrows,
    assertArrayContains,
    assertStringContains,
} from "https://deno.land/std/testing/asserts.ts";

import { stub, spy } from "https://deno.land/x/mock/mod.ts"

// Helper objects for the tests
class OnewayA {
    sendToA(...args) {}
}

class OnewayB {}

class OnewayTestPipe extends Pipe {
    static FIRST_INTERFACE_NAME = 'OnewayA';
    static SECOND_INTERFACE_NAME = 'OnewayB';
}

OnewayTestPipe.addInterfaceMethod('sendToA', 'OnewayA', OnewayCollection);

function createOnewayTestObjects() {
    class OnewayPipe extends OnewayTestPipe { }

    const a = new OnewayA();
    const b = new OnewayB();
    const pipe = new OnewayPipe(a, b);

    return [a, b, pipe];
}

// Function called if test involves mocking an operation's bheavoir
function onewayTestHelper(functionArgs, mockedOperation, mockedOperationReturn) {
    const [a, b, pipe] = createOnewayTestObjects();

    const operationFunction = stub(pipe, mockedOperation + 'SendToA', mockedOperationReturn);
    const endpoint = stub(a, 'sendToA');

    pipe.sendToA(b, ...functionArgs);

    return [operationFunction, endpoint];
}

Deno.test("OnewayCollection passes filter function args correctly", () => {
    const functionArgs = [1, 2, 3];

    const [filterFunction, endpoint] = onewayTestHelper(functionArgs, 'filter');

    assertEquals(filterFunction.calls[0].args, functionArgs);
});


Deno.test("OnewayCollection passes transform function args correctly", () => {
    const [a, b, pipe] = createOnewayTestObjects();

    // Use a spy to get default behavoir instead of an undefined/custom return value
    const transformFunction = spy(pipe, 'transformSendToA');

    const functionArgs = [1, 2, 3];

    pipe.sendToA(b, ...functionArgs);

    assertEquals(transformFunction.calls[0].args, functionArgs);
});

Deno.test("OnewayCollection operation does filter", () => {
    const functionArgs = [1, 2, 3];

    const [filterFunction, endpoint] = onewayTestHelper(functionArgs, 'filter', [true]);

    assertEquals(endpoint.calls.length, 0);
});

Deno.test("OnewayCollection operation does not filter", () => {
    const functionArgs = [1, 2, 3];

    const [filterFunction, endpoint] = onewayTestHelper(functionArgs, 'filter', [false]);

    assertEquals(endpoint.calls.length, 1);
});

Deno.test("OnewayCollection transforms argument correctly", () => {
    const functionArgs = [1, 2, 3];

    const [transformFunction, endpoint] = onewayTestHelper(functionArgs, 'transform', 
        (a, b, c) => [a + 1, b + 2, c + 3]);

    const expectedTransformedArgs = [2, 4, 6];

    assertEquals(endpoint.calls.length, 1);
    assertArrayContains(endpoint.calls[0].args, expectedTransformedArgs);
});

Deno.test("OnewayCollection passes correct arguments to endpoint", () => {
    const [a, b, pipe] = createOnewayTestObjects();

    // Don't need to mock any transform operations
    const endpoint = stub(a, 'sendToA');

    const functionArgs = [1, 2, 3];

    pipe.sendToA(b, ...functionArgs);

    assertEquals(endpoint.calls.length, 1);
    assertEquals(endpoint.calls[0].args, [pipe, ...functionArgs]);
});

Deno.test("OnewayCollection warns on arg count mismatch", () => {
    const functionArgs = [1, 2, 3];

    const consoleWarn = stub(console, 'warn');

    const [transformFunction, endpoint] = onewayTestHelper(functionArgs, 'transform', 
        (a, b, c) => [a, b, c, a]);

    assertEquals(consoleWarn.calls.length, 1);
    assertStringContains(consoleWarn.calls[0].args[0], "3 arguments were passed to " +
        "OnewayPipe.transformSendToA, but the function returned 4 arguments");

    consoleWarn.restore();
});

Deno.test("OnewayCollection throws error on non-iterator", () => {
    const [a, b, pipe] = createOnewayTestObjects();

    const transformFunction = stub(pipe, 'transformSendToA', [0]);

    const functionArgs = [1, 2, 3];

    assertThrows(
        () => {pipe.sendToA(b, ...functionArgs)},
        Error,
        "OnewayPipe.transformSendToA did not return an iterable"
    );
});

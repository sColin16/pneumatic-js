import {
    Pipe,
    TwowayCollection,
} from "../index.js"

import {
    assertEquals,
    assertThrows,
    assertArrayContains,
    assertStringContains,
} from "https://deno.land/std/testing/asserts.ts";

import { stub, spy } from "https://deno.land/x/mock/mod.ts"

// Helper objects for the tests
class TwowayA {
    requestFromA(senderHandle, ...args) {
        return args;
    }
}

class TwowayB {}

class TwowayTestPipe extends Pipe {
    static FIRST_INTERFACE_NAME = 'TwowayA';
    static SECOND_INTERFACE_NAME = 'TwowayB';
}

TwowayTestPipe.addInterfaceMethod('requestFromA', 'TwowayA', TwowayCollection);

function createTwowayTestObjects() {
    class TwowayPipe extends TwowayTestPipe { }

    const a = new TwowayA();
    const b = new TwowayB();
    const pipe = new TwowayPipe(a, b);

    return [a, b, pipe];
}

// Function called if test involves mocking an operation's bheavoir
function twowayTestHelper(functionArgs, mockedOperation, mockedOperationReturn) {
    const [a, b, pipe] = createTwowayTestObjects();

    const operationFunction = stub(pipe, mockedOperation + 'RequestFromA', mockedOperationReturn);
    const endpoint = spy(a, 'requestFromA');

    const response = pipe.requestFromA(b, ...functionArgs);

    return [operationFunction, endpoint, response];
}

Deno.test("TwowayCollection passes request transform function args correctly", () => {
    const [a, b, pipe] = createTwowayTestObjects();

    const requestTransformFunction = spy(pipe, 'transformRequestRequestFromA');
    const endpoint = stub(a, 'requestFromA');

    const functionArgs = [1, 2, 3];

    pipe.requestFromA(b, ...functionArgs);

    assertEquals(requestTransformFunction.calls[0].args, functionArgs);
});

Deno.test("TwowayCollection warns on arg count mismatch", () => {
    const functionArgs = [1, 2, 3];

    const consoleWarn = stub(console, 'warn');

    const [transformRequestFunction, endpoint, response] = twowayTestHelper(functionArgs,
        'transformRequest', (a, b, c) => [a, b, c, a]);

    assertEquals(consoleWarn.calls.length, 1);
    assertStringContains(consoleWarn.calls[0].args[0], "3 arguments were passed to " +
        "TwowayPipe.transformRequestRequestFromA, but the function returned 4 arguments");

    consoleWarn.restore();
});

Deno.test("TwowayCollection throws error no non-iterator", () => {
    const [a, b, pipe] = createTwowayTestObjects();

    const transformFunction = stub(pipe, 'transformRequestRequestFromA', [0]);

    const functionArgs = [1, 2, 3];

    assertThrows(
        () => {pipe.requestFromA(b, ...functionArgs)},
        Error,
        "TwowayPipe.transformRequestRequestFromA did not return an iterable"
    );
});

Deno.test("TwowayCollection transforms request correctly", () => {
    const functionArgs = [1, 2, 3];

    const [transformRequestFunction, endpoint, response] = twowayTestHelper(functionArgs, 
        'transformRequest', (a, b, c) => [a + 1, b + 2, c + 3]);

    const expectedTransformArgs = [2, 4, 6];

    assertEquals(endpoint.calls.length, 1);
    assertArrayContains(endpoint.calls[0].args, expectedTransformArgs);
});

Deno.test("TwowayCollection passes arguments to endpoint correctly", () => {
    const [a, b, pipe] = createTwowayTestObjects();

    const endpoint = stub(a, 'requestFromA');

    const functionArgs = [1, 2, 3];

    pipe.requestFromA(b, ...functionArgs);

    assertEquals(endpoint.calls.length, 1);
    assertEquals(endpoint.calls[0].args, [pipe, ...functionArgs]);
});

Deno.test("TwowayCollection transforms response correctly", () => {
    const functionArgs = [1, 2, 3];

    const [transformResponseFunction, endpoint, response] = twowayTestHelper(functionArgs,
        'transformResponse', (input) => [input[0] -1 , input[1] - 2, input[2] - 3]);
        
    const expectedResponse = [0, 0, 0];

    assertEquals(expectedResponse, response);
});

import {
    Pipe,
    PipeBuilder,
    Operation,
    OperationCollection,
} from "../index.js"

import {
    assert,
    assertEquals,
    assertThrows,
} from "https://deno.land/std/testing/asserts.ts";

class ValidPipeSubclass extends Pipe {
    static FIRST_INTERFACE_NAME = 'first';
    static SECOND_INTERFACE_NAME = 'second';
}

import { stub, returnsThis } from "https://deno.land/x/mock/mod.ts"

const a = () => {};
const b = () => {};
const c = () => {};

class OperationA extends Operation {
    static PREFIX = 'a';

    static getDefaultOperation() {
        return a;
    }
}

class OperationB extends Operation {
    static PREFIX = 'b';

    static getDefaultOperation() {
        return b;
    }
}

class OperationC extends Operation {
    static PREFIX = 'c';

    static getDefaultOperation() {
        return c;
    }
}

class TestCollection extends OperationCollection {
    static validOperations = {
        'a': OperationA,
        'b': OperationB,
        'c': OperationC
    }
}

Deno.test("PipeBuilder addInterfaceMethod throws error with invalid interface name" , () => {
    assertThrows(
        () => PipeBuilder.addInterfaceMethod(ValidPipeSubclass, 'myMethod', 'notfirst'),
        Error,
        "notfirst is not a valid interface for ValidPipeSubclass"
    )
});

Deno.test("PipeBuilder addInterfaceMethod binds function to methodName", () => {
    class TestPipe extends ValidPipeSubclass {};
    class EmptyCollection extends OperationCollection {};

    const interfaceMethod = () => {};
    const interfaceMethodFactory = stub(PipeBuilder, 'interfaceMethodFactory', [interfaceMethod]);

    PipeBuilder.addInterfaceMethod(TestPipe, 'myMethod', 'first', EmptyCollection);    

    assertEquals(TestPipe.prototype.myMethod, interfaceMethod);

    interfaceMethodFactory.restore();
});

Deno.test("PipeBuilder addInterfaceMethod binds all operation methods", () => {
    class TestPipe extends ValidPipeSubclass {};

    const interfaceMethod = () => {};
    const interfaceMethodFactory = stub(PipeBuilder, 'interfaceMethodFactory', [interfaceMethod]);

    PipeBuilder.addInterfaceMethod(TestPipe, 'Method', 'first', TestCollection);    

    assertEquals(TestPipe.prototype.aMethod, a);
    assertEquals(TestPipe.prototype.bMethod, b);
    assertEquals(TestPipe.prototype.cMethod, c);
    
    interfaceMethodFactory.restore();
});

Deno.test("PipeBuilder interfaceMethodFactory function throws error on undefined handle", () => {
    class TestPipe extends ValidPipeSubclass {};

    const operationCollectionFactory = stub(TestCollection, 'operationCollectionFactory');

    const outputFunction = PipeBuilder.interfaceMethodFactory("myMethod", "first",
        TestCollection);

    TestPipe.prototype.operationCollectionFunction = outputFunction;

    const testPipe = new TestPipe('firstObject');

    assertThrows (
        () => testPipe.operationCollectionFunction('secondObject'),
        Error,
        "The handle for interface second is not defined"
    )

    operationCollectionFactory.restore();
});

Deno.test("PipeBuilder interfaceMethodFactory function throws error on invalid sender", () => {
    class TestPipe extends ValidPipeSubclass {};

    const operationCollectionFactory = stub(TestCollection, 'operationCollectionFactory');

    const outputFunction = PipeBuilder.interfaceMethodFactory("myMethod", "first",
        TestCollection);

    TestPipe.prototype.operationCollectionFunction = outputFunction;

    const testPipe = new TestPipe('firstObject', 'secondObject');

    assertThrows (
        () => testPipe.operationCollectionFunction('invalidObject'),
        Error,
        "Sender handle does not match"
    )

    operationCollectionFactory.restore();
});

Deno.test("PipeBuilder interfaceMethodFactory calls operation collection correctly", () => {
    class TestPipe extends ValidPipeSubclass {};

    const operationCollectionFunction = stub();
    const bind = stub(operationCollectionFunction, "bind", function(){return this});
    const operationCollectionFactory = stub(TestCollection, 'operationCollectionFactory',
        [operationCollectionFunction]);

    const outputFunction = PipeBuilder.interfaceMethodFactory("myMethod", "first",
        TestCollection);

    TestPipe.prototype.operationCollectionFunction = outputFunction;

    const testPipe = new TestPipe('firstObject', 'secondObject');

    testPipe.operationCollectionFunction('secondObject', 1, 2, 3);

    // Check that the function is bound to the pipe before it is called
    assertEquals(bind.calls.length, 1);
    assertEquals(bind.calls[0].args, [testPipe]);

    // Also check that it was passed the correct arguments
    assertEquals(operationCollectionFunction.calls.length, 1);
    assertEquals(operationCollectionFunction.calls[0].args, ['secondObject', 1, 2, 3]);

    operationCollectionFactory.restore();
});

Deno.test("PipeBuilder interfaceMethodFactory names function correctly", () => {
    class TestPipe extends ValidPipeSubclass {};

    const operationCollectionFactory = stub(TestCollection, 'operationCollectionFactory');

    const outputFunction = PipeBuilder.interfaceMethodFactory("myMethod", "first",
        TestCollection);
    
    assertEquals(outputFunction.name, "myMethod");

    operationCollectionFactory.restore();
});

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

class First {};
class Second {};

class OtherClass {};

class ValidPipeSubclass extends Pipe {
    static FIRST_INTERFACE = First;
    static SECOND_INTERFACE = Second;
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

Deno.test("Pipe Builder addInterfaceMethod throws error with undefined interfaces", () => {
    class EmptyCollection extends OperationCollection {};
    class InvalidPipeSubclass extends Pipe {
        static FIRST_INTERFACE = First;
    }

    assertThrows(
        () => PipeBuilder.addInterfaceMethod(InvalidPipeSubclass, First, 'myMethod',
            EmptyCollection),
        Error,
        "One or more of the interfaces are not defined for InvalidPipeSubclass"
    )
});

Deno.test("PipeBuilder addInterfaceMethod throws error with invalid interface class" , () => {
    assertThrows(
        () => PipeBuilder.addInterfaceMethod(ValidPipeSubclass, OtherClass, 'myMethod'),
        Error,
        "OtherClass is not a valid interface for ValidPipeSubclass"
    )
});

Deno.test("PipeBuilder addInterfaceMethod binds function to methodName", () => {
    class TestPipe extends ValidPipeSubclass {};
    class EmptyCollection extends OperationCollection {};

    const interfaceMethod = () => {};
    const interfaceMethodFactory = stub(PipeBuilder, 'interfaceMethodFactory', [interfaceMethod]);

    PipeBuilder.addInterfaceMethod(TestPipe, First, 'myMethod', EmptyCollection);    

    assertEquals(TestPipe.prototype.myMethod, interfaceMethod);

    interfaceMethodFactory.restore();
});

Deno.test("PipeBuilder addInterfaceMethod binds all operation methods", () => {
    class TestPipe extends ValidPipeSubclass {};

    const interfaceMethod = () => {};
    const interfaceMethodFactory = stub(PipeBuilder, 'interfaceMethodFactory', [interfaceMethod]);

    PipeBuilder.addInterfaceMethod(TestPipe, First, 'Method', TestCollection);    

    assertEquals(TestPipe.prototype.aMethod, a);
    assertEquals(TestPipe.prototype.bMethod, b);
    assertEquals(TestPipe.prototype.cMethod, c);
    
    interfaceMethodFactory.restore();
});

Deno.test("PipeBuilder interfaceMethodFactory function throws error on undefined handle", () => {
    class TestPipe extends ValidPipeSubclass {};

    const operationCollectionFactory = stub(TestCollection, 'operationCollectionFactory');

    const outputFunction = PipeBuilder.interfaceMethodFactory(First, "myMethod",
        TestCollection);

    TestPipe.prototype.operationCollectionFunction = outputFunction;

    const testPipe = new TestPipe('firstObject');

    assertThrows (
        () => testPipe.operationCollectionFunction('secondObject'),
        Error,
        "The handle for interface Second is not defined"
    )

    operationCollectionFactory.restore();
});

Deno.test("PipeBuilder interfaceMethodFactory calls operation collection correctly", () => {
    class TestPipe extends ValidPipeSubclass {};

    const operationCollectionFunction = stub();
    const bind = stub(operationCollectionFunction, "bind", function(){return this});
    const operationCollectionFactory = stub(TestCollection, 'operationCollectionFactory',
        [operationCollectionFunction]);

    const outputFunction = PipeBuilder.interfaceMethodFactory(First, "myMethod", 
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

    const outputFunction = PipeBuilder.interfaceMethodFactory(First, "myMethod",
        TestCollection);
    
    assertEquals(outputFunction.name, "myMethod");

    operationCollectionFactory.restore();
});

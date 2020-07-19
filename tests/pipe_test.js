import {
    Pipe,
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

function assertNoThrow(fn) {
    try {
        fn()
    } catch {
        assert(false, `${fn.name} unexpectedly threw an error`);
    }
}

Deno.test("Pipe throws error when interface names undefined", () => {
    class InvalidPipeSubclass extends Pipe {
        static FIRST_INTERFACE_NAME = 'first';
    }

    assertThrows(
        () => {new InvalidPipeSubclass()},
        Error,
        "One or more of the interface names isn't defined for InvalidPipeSubclass"
    )
});

Deno.test("Pipe doesn't throw error when interface names are defined", () => {
    assertNoThrow(() => new ValidPipeSubclass());
});

Deno.test("Pipe verifyHandlesDefined throws error when interface name undefined", () => {
    const missingHandlePipe = new ValidPipeSubclass('a');

    assertThrows(
        () => {missingHandlePipe.verifyHandlesDefined()},
        Error,
        "The handle for interface second is not defined"
    );
});

Deno.test("Pipe verifyHandlesDefined doesn't throw error when interface named defined", () => {
    const definedHandlesPipe = new ValidPipeSubclass('a', 'b');

    assertNoThrow(() => definedHandlesPipe.verifyHandlesDefined());
});

Deno.test("Pipe verifySenderHandle throws error wtih invalid sender", () => {
    const pipe = new ValidPipeSubclass('firstObject', 'secondObject');

    assertThrows(
        () => {pipe.verifySenderHandle('firstObject', 'first')},
        Error,
        "Sender handle does not match"
    );
});

Deno.test("Pipe verifySenderHandle doesn't throw error with valid sender", () => {
    const pipe = new ValidPipeSubclass('firstObject', 'secondObject');

    assertNoThrow(() => pipe.verifySenderHandle('secondObject', 'first'))
});

Deno.test("Pipe verifyInterfaceName throws error with invalid interface name", () => {
    assertThrows(
        () => ValidPipeSubclass.verifyInterfaceName('notfirst'),
        Error,
        'notfirst is not a valid interface for ValidPipeSubclass'
    );
});

Deno.test("Pipe verifyInterfaceName doesn't throw error with valid interface name", () => {
    assertNoThrow(() => ValidPipeSubclass.verifyInterfaceName('second'));
});

Deno.test("Pipe getOppositeInterfaceName first -> second", () => {
    assertEquals(ValidPipeSubclass.getOppositeInterfaceName('first'), 'second');
});

Deno.test("Pipe getOppositeInterfaceName second -> first", () => {
    assertEquals(ValidPipeSubclass.getOppositeInterfaceName('second'), 'first');
});

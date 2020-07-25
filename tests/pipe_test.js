import {
    Pipe,
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
        "One or more of the interfaces are not defined for InvalidPipeSubclass"
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
        "The handle for interface Second is not defined"
    );
});

Deno.test("Pipe verifyHandlesDefined doesn't throw error when interface named defined", () => {
    const definedHandlesPipe = new ValidPipeSubclass('a', 'b');

    assertNoThrow(() => definedHandlesPipe.verifyHandlesDefined());
});

Deno.test("Pipe verifySenderHandle throws error wtih invalid sender", () => {
    const pipe = new ValidPipeSubclass('firstObject', 'secondObject');

    assertThrows(
        () => {pipe.verifySenderHandle('firstObject', First)},
        Error,
        "Invalid sender. firstObject cannot send messages through this pipe to the interface "+
            "First"
    );
});

Deno.test("Pipe verifySenderHandle doesn't throw error with valid sender", () => {
    const pipe = new ValidPipeSubclass('firstObject', 'secondObject');

    assertNoThrow(() => pipe.verifySenderHandle('secondObject', First))
});

Deno.test("Pipe verifyInterfaceClass throws error with invalid interface name", () => {
    assertThrows(
        () => ValidPipeSubclass.verifyInterfaceClass(OtherClass),
        Error,
        'OtherClass is not a valid interface for ValidPipeSubclass'
    );
});

Deno.test("Pipe verifyInterfaceType doesn't throw error with valid interface name", () => {
    assertNoThrow(() => ValidPipeSubclass.verifyInterfaceClass(Second));
});

Deno.test("Pipe getOppositeInterfaceName first -> second", () => {
    assertEquals(ValidPipeSubclass.getOppositeInterface(First), Second);
});

Deno.test("Pipe getOppositeInterfaceName second -> first", () => {
    assertEquals(ValidPipeSubclass.getOppositeInterface(Second), First);
});

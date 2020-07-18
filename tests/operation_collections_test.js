import {
    OperationCollection,
} from "../index.js"

import {
    assertThrows,
} from "https://deno.land/std/testing/asserts.ts";

Deno.test("Operation Collection default factory throws error if not overridden", () => {
    class OperationCollectionSubclass extends OperationCollection {};

    assertThrows(
        () => {OperationCollectionSubclass.operationCollectionFactory("myMethod", "myInterface")},
        Error,
        "operationCollectionFactory not defined for OperationCollectionSubclass"
    );
});

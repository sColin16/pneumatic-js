import {
    Pipe,
    PipeWelder,
} from "../index.js"

import {
    assert,
    assertEquals,
    assertThrows,
} from "https://deno.land/std/testing/asserts.ts";

class First {};
class Second {};

class ValidPipeSubclass extends Pipe {
    static FIRST_INTERFACE = First;
    static SECOND_INTERFACE = Second;
}

Deno.test("PipeWelder detects pipelinable object", () => {
    const pipe = new ValidPipeSubclass;

    assert(PipeWelder.isPipelineableObject(pipe));
})

Deno.test("PipeWelder detect non-pipelinable object", () => {
    const nonpipelinableObject = new First();

    assert(!PipeWelder.isPipelineableObject(nonpipelinableObject));
});
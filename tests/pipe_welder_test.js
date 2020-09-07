import {
    Pipe,
    PipeWelder,
    HandledObject
} from "../index.js"

import {
    First,
    Second,
    createPipelineTestObjects
} from "./pipe_test.js"

import {
    assert,
    assertEquals,
    assertThrows,
} from "https://deno.land/std/testing/asserts.ts";

class ValidPipeSubclass extends Pipe {
    static FIRST_INTERFACE = First;
    static SECOND_INTERFACE = Second;
}

class DynamicallyHandledObject extends HandledObject {
    getHandle(senderHandle) {
        const dynamicPipe = new ValidPipeSubclass();

        dynamicPipe.setDirectHandle(Second, this);

        this.link = dynamicPipe;

        return dynamicPipe;
    }
}

Deno.test("PipeWelder detects handled object", () => {
    let handledObject = new HandledObject();

    assert(PipeWelder.isHandledObject(handledObject));
});

Deno.test("PipeWelder detects non-handled object", () =>{
    let nonHandledObject = new First();

    assert(!PipeWelder.isHandledObject(nonHandledObject));
});

Deno.test("PipeWelder detects pipelinable object", () => {
    const pipe = new ValidPipeSubclass;

    assert(PipeWelder.isPipelineableObject(pipe));
});

Deno.test("PipeWelder detects non-pipelinable object", () => {
    const nonpipelinableObject = new First();

    assert(!PipeWelder.isPipelineableObject(nonpipelinableObject));
});

Deno.test("PipeWelder weldObject", () => {
    const pipelineEnd = new ValidPipeSubclass();
    const weldedObject = new Second();

    PipeWelder.weldObject(pipelineEnd, Second, weldedObject);

    assertEquals(pipelineEnd.getDirectHandle(Second), weldedObject);
});

Deno.test("PipeWelder weldPipes welds single pipe", () => {
    const pipelineEnd = new ValidPipeSubclass();
    const targetPipe = new ValidPipeSubclass();

    PipeWelder.weldPipes(pipelineEnd, First, targetPipe);

    assertEquals(pipelineEnd.getDirectHandle(First), targetPipe);
    assertEquals(targetPipe.getDirectHandle(Second), pipelineEnd);
});

Deno.test("PipeWelder weldHandledObject welds dynamically handled object", () => {
    const pipelineEnd = new ValidPipeSubclass();
    const targetObject = new DynamicallyHandledObject();

    PipeWelder.weldHandledObject(pipelineEnd, Second, targetObject);

    assertEquals(pipelineEnd.getDirectHandle(Second), targetObject.link);
    assertEquals(targetObject.link.getDirectHandle(First), pipelineEnd);
});

Deno.test("PipeWelder weldHandledObject welds object", () => {
    const pipelineEnd = new ValidPipeSubclass();
    const handledObject = new HandledObject();

    PipeWelder.weldHandledObject(pipelineEnd, Second, handledObject);

    assertEquals(pipelineEnd.getDirectHandle(Second), handledObject);
})

Deno.test("PipeWelder appendToPipeline welds pipeline", () => {
    const [pipeA, pipeB, pipeC] = createPipelineTestObjects();
    const [pipeD, pipeE, pipeF] = createPipelineTestObjects();

    PipeWelder.appendToPipeline(pipeA, Second, pipeF);

    assertEquals(pipeC.getDirectHandle(Second), pipeD);
    assertEquals(pipeD.getDirectHandle(First), pipeC);
});

Deno.test("PipeWelder appendToPipeline welds dynamically handled object", () => {
    const [pipeA, pipeB, pipeC] = createPipelineTestObjects();
    const targetObject = new DynamicallyHandledObject();

    PipeWelder.appendToPipeline(pipeA, Second, targetObject);

    assertEquals(pipeC.getDirectHandle(Second), targetObject.link);
    assertEquals(targetObject.link.getDirectHandle(First), pipeC);
});

Deno.test("PipeWelder appendToPipeline welds object", () => {
    const [pipeA, pipeB, pipeC] = createPipelineTestObjects();
    const targetObject = new HandledObject();

    PipeWelder.appendToPipeline(pipeA, Second, targetObject);

    assertEquals(pipeC.getDirectHandle(Second), targetObject);
});

Deno.test("PipeWelder appendToPipeline throws error on fully-conected pipeline", () => {
    const [pipeA, pipeB, pipeC] = createPipelineTestObjects();
    const weldedObject = new HandledObject();

    PipeWelder.appendToPipeline(pipeA, Second, weldedObject);

    assertThrows(
        () => PipeWelder.appendToPipeline(pipeA, Second, weldedObject),
        Error,
        'The Second end of the pipeline is already welded'
    )
});

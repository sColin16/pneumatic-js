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

class DynamicHandledObject extends HandledObject {
    getHandle(senderHandle, ...args) {
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
    const weldedPipe = new ValidPipeSubclass();

    PipeWelder.weldPipes(pipelineEnd, pipelineEnd, First, weldedPipe);

    assertEquals(pipelineEnd.getDirectHandle(First), weldedPipe);
    assertEquals(weldedPipe.getDirectHandle(Second), pipelineEnd);
});

Deno.test("PipeWelder weldPipes welds pipeline", () => {
    const pipelineEnd = new ValidPipeSubclass();

    const [pipeA, pipeB, pipeC] = createPipelineTestObjects();

    PipeWelder.weldPipes(pipelineEnd, pipelineEnd, Second, pipeC);

    assertEquals(pipelineEnd.getDirectHandle(Second), pipeA);
    assertEquals(pipeA.getDirectHandle(First), pipelineEnd);
});

Deno.test("PipeWelder weldHandledObject welds pipeline", () => {
    const pipelineEnd = new ValidPipeSubclass();

    const [pipeA, pipeB, pipeC] = createPipelineTestObjects();

    PipeWelder.weldHandledObject(pipelineEnd, pipelineEnd, Second, pipeC);

    assertEquals(pipelineEnd.getDirectHandle(Second), pipeA);
    assertEquals(pipeA.getDirectHandle(First), pipelineEnd);
});

Deno.test("PipeWelder weldHandledObject welds object", () => {
    const pipelineEnd = new ValidPipeSubclass();
    
    const handledObject = new HandledObject();

    PipeWelder.weldHandledObject(pipelineEnd, pipelineEnd, Second, handledObject);

    assertEquals(pipelineEnd.getDirectHandle(Second), handledObject);
})

Deno.test("PipeWelder weldHandledObject welds dynamic handled object", () => {
    const pipelineEnd = new ValidPipeSubclass();
    const weldedObject = new DynamicHandledObject();

    PipeWelder.weldHandledObject(pipelineEnd, pipelineEnd, Second, weldedObject);

    assertEquals(pipelineEnd.getDirectHandle(Second), weldedObject.link);
    assertEquals(weldedObject.link.getDirectHandle(First), pipelineEnd);
});

Deno.test("PipeWelder appendToPipeline welds pipeline", () => {
    const [pipeA, pipeB, pipeC] = createPipelineTestObjects();
    const [pipeD, pipeE, pipeF] = createPipelineTestObjects();

    PipeWelder.appendToPipeline(pipeA, pipeA, Second, pipeF);

    assertEquals(pipeC.getDirectHandle(Second), pipeD);
    assertEquals(pipeD.getDirectHandle(First), pipeC);
});

Deno.test("PipeWelder appendToPipeline welds dynamic handled object", () => {
    const [pipeA, pipeB, pipeC] = createPipelineTestObjects();
    const weldedObject = new DynamicHandledObject();

    PipeWelder.appendToPipeline(pipeA, pipeA, Second, weldedObject);

    assertEquals(pipeC.getDirectHandle(Second), weldedObject.link);
    assertEquals(weldedObject.link.getDirectHandle(First), pipeC);
});

Deno.test("PipeWelder appendToPipeline welds object", () => {
    const [pipeA, pipeB, pipeC] = createPipelineTestObjects();
    const weldedObject = new HandledObject();

    PipeWelder.appendToPipeline(pipeA, pipeA, Second, weldedObject);

    assertEquals(pipeC.getDirectHandle(Second), weldedObject);
});

Deno.test("PipeWelder appendToPipeline throws error on fully-conected pipeline", () => {
    const [pipeA, pipeB, pipeC] = createPipelineTestObjects();
    const weldedObject = new HandledObject();

    PipeWelder.appendToPipeline(pipeA, pipeA, Second, weldedObject);

    assertThrows(
        () => PipeWelder.appendToPipeline(pipeA, pipeA, Second, weldedObject),
        Error,
        'Cannot get handle for the pipeline. Pipeline is already fully connected'
    )
});

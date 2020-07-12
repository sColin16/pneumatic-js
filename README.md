# Pneumatic-js

Pneumatic allows you to build scalable, extendable pipelines that can transform
or filter messages before they reach a target object. Best of all, Pneumatic
requires almost no changes to your original objects, so you can easily plug it
in to any project!

All you have to do is...

 1. Define the interface between two objects
 2. Define the operations to be performed in the pipeline

Then, you can snap together multiple pipes, call methods on the pipeline as if
it were the original object!

## Roadmap

Check out the [Trello Board](https://trello.com/b/5LoKS2xK) to see what's on the road map

## Details

Pneumatic leverages bracket notation and function factories to dynamically
create classes that implement the interface between two objects, and that can
perform operations when interface methods are called


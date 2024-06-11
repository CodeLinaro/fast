---
id: fast-foundation.transient
title: transient() function
hide_title: true
---
<!-- Do not edit this file. It is automatically generated by API Documenter. -->

[@microsoft/fast-foundation](./fast-foundation.md) &gt; [transient](./fast-foundation.transient.md)

## transient() function

Registers the decorated class as a transient dependency; each time the dependency is resolved a new instance will be created.

<b>Signature:</b>

```typescript
export declare function transient<T extends Constructable>(): typeof transientDecorator;
```
<b>Returns:</b>

typeof transientDecorator

## Example


```ts
@transient()
class Foo { }

```
const ArrayPrototypeIteratorPrototype = Object.getPrototypeOf(Array.prototype[Symbol.iterator]());

export function createIterator(
  name: string,
  internalIteratorSymbol: symbol,
  keyIndex: string | number,
  valueIndex: string | number,
) {
  if (keyIndex == null) keyIndex = 0;
  if (valueIndex == null) keyIndex = 1;

  const iteratorObject = Object.create(ArrayPrototypeIteratorPrototype);

  const internalObject = Symbol("internal Object");

  Object.defineProperty(iteratorObject, "next", {
    value: function next() {
      if (typeof this !== "object" || this === null || !(internalObject in this)) {
        throw new TypeError(`next() called on a value that is not a ${name} iterator object`);
      }
      const state = this[internalObject];
      const { target, kind, index } = state;
      const values = target[internalIteratorSymbol];

      if (index >= values.length) {
        return { value: undefined, done: true };
      }
      const { [keyIndex!]: key, [valueIndex!]: value } = values[index];
      state.index = index + 1;
      let result;
      if (kind === "key") {
        result = key;
      } else if (kind === "value") {
        result = value;
      } else {
        result = [key, value];
      }
      return {
        value: result,
        done: false,
      };
    },
    writable: true,
    enumerable: true,
    configurable: true,
  });

  Object.defineProperty(iteratorObject, Symbol.toStringTag, {
    value: `${name} Iterator`,
    writable: false,
    enumerable: false,
    configurable: true,
  });

  return function (target: any, kind: "key" | "value" | "key+value") {
    const iterator = Object.create(iteratorObject);
    Object.defineProperty(iterator, internalObject, {
      value: {
        target: target,
        kind: kind,
        index: 0,
      },
      writable: false,
      enumerable: false,
      configurable: true,
    });
    return iterator;
  };
}

export function createFastIterator<F extends (target: any) => any[]>(
  name: string,
  internalIteratorSymbol: symbol,
  keyIndex: string | number = 0,
  valueIndex: string | number = 1,
) {
  type T = Parameters<F>[0];
  type K = ReturnType<F>[number][0];
  type V = ReturnType<F>[number][1];
  class FastIterableIterator {
    #target: any;
    #kind: "key" | "value" | "key+value";
    #index;

    // https://webidl.spec.whatwg.org/#dfn-default-iterator-object
    constructor(target: T, kind: "key" | "value" | "key+value") {
      this.#target = target;
      this.#kind = kind;
      this.#index = 0;
    }

    next() {
      // 1. Let interface be the interface for which the iterator prototype object exists.
      // 2. Let thisValue be the this value.
      // 3. Let object be ? ToObject(thisValue).
      // 4. If object is a platform object, then perform a security
      //    check, passing:
      // 5. If object is not a default iterator object for interface,
      //    then throw a TypeError.
      // Object.getPrototypeOf(this) !== FastIterator.prototype
      if (typeof this !== "object" || this === null || !(#target in this)) {
        throw new TypeError(
          `'next' called on an object that does not implement interface ${name} Iterator.`,
        );
      }

      // 6. Let index be object’s index.
      // 7. Let kind be object’s kind.
      // 8. Let values be object’s target's value pairs to iterate over.
      const index = this.#index;
      const values = this.#target[internalIteratorSymbol];

      // 9. Let len be the length of values.
      const len = values.length;

      // 10. If index is greater than or equal to len, then return
      //     CreateIterResultObject(undefined, true).
      if (index >= len) {
        return {
          value: undefined,
          done: true,
        };
      }

      // 11. Let pair be the entry in values at index index.
      const { [keyIndex!]: key, [valueIndex!]: value } = values[index];

      // 12. Set object’s index to index + 1.
      this.#index = index + 1;

      // 13. Return the iterator result for pair and kind.

      // https://webidl.spec.whatwg.org/#iterator-result

      // 1. Let result be a value determined by the value of kind:
      let result;
      if (this.#kind === "key") {
        // 1. Let idlKey be pair’s key.
        // 2. Let key be the result of converting idlKey to an
        //    ECMAScript value.
        // 3. result is key.
        result = key;
      } else if (this.#kind === "value") {
        // 1. Let idlValue be pair’s value.
        // 2. Let value be the result of converting idlValue to
        //    an ECMAScript value.
        // 3. result is value.
        result = value;
      } else {
        // 1. Let idlKey be pair’s key.
        // 2. Let idlValue be pair’s value.
        // 3. Let key be the result of converting idlKey to an
        //    ECMAScript value.
        // 4. Let value be the result of converting idlValue to
        //    an ECMAScript value.
        // 5. Let array be ! ArrayCreate(2).
        // 6. Call ! CreateDataProperty(array, "0", key).
        // 7. Call ! CreateDataProperty(array, "1", value).
        // 8. result is array.
        result = [key, value];
      }
      // 2. Return CreateIterResultObject(result, false).
      return {
        value: result,
        done: false,
      };
    }
  }
  // https://webidl.spec.whatwg.org/#dfn-iterator-prototype-object
  //@ts-ignore
  delete FastIterableIterator.prototype.constructor;

  Object.setPrototypeOf(
    FastIterableIterator.prototype,
    Object.getPrototypeOf(Array.prototype[Symbol.iterator]()),
  );

  Object.defineProperties(FastIterableIterator.prototype, {
    [Symbol.toStringTag]: {
      writable: false,
      enumerable: false,
      configurable: true,
      value: `${name} Iterator`,
    },
    next: { writable: true, enumerable: true, configurable: true },
  });

  return <Kind extends "key" | "value" | "key+value">(target: T, kind: Kind) =>
    new FastIterableIterator(target, kind) as unknown as IterableIterator<
      Kind extends "key" ? K : Kind extends "value" ? V : [K, V]
    >;
}

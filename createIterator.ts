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

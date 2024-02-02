const ArrayPrototypeIteratorPrototype = Object.getPrototypeOf(
  Array.prototype[Symbol.iterator]()
);

export function generateIterator(
  getValues: () => any[],
  name: string,
  kind: "key" | "value" | "key+value",
  keyIndex?: string | number,
  valueIndex?: string | number
) {
  if (keyIndex == null) keyIndex = 0;
  if (valueIndex == null) keyIndex = 1;
  const state = {
    target: getValues,
    kind: kind,
    index: 0,
  };
  const iterator = Object.create(ArrayPrototypeIteratorPrototype);

  Object.defineProperty(iterator, "next", {
    value: function next() {
      if (Object.getPrototypeOf(this) !== iterator) {
        throw new TypeError(
          `next() called on a value that is not a ${name} iterator object`
        );
      }
      const { target, kind, index } = state;
      const values = target();
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

  Object.defineProperty(iterator, Symbol.toStringTag, {
    value: `${name} Iterator`,
    writable: false,
    enumerable: false,
    configurable: true,
  });
  return Object.create(iterator);
}

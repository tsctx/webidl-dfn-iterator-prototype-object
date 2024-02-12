import { createFastIterator } from "./createIterator.ts";

function checkRequiredArguments(
  arg: any[] | IArguments | number,
  required: number,
  prefix?: string,
) {
  if ((typeof arg === "number" ? arg : (arg = arg.length)) < required) {
    const errMsg = `${prefix ? prefix + ": " : ""}${required} argument${
      required === 1 ? "" : "s"
    } required, but only ${arg} present.`;
    throw new TypeError(errMsg);
  }
}

function brandCheck(self: any, instance: any) {
  if (!(self instanceof instance)) {
    throw new TypeError("Illegal invocation");
  }
}

export function iteratorMixin(
  name: string,
  object: any,
  internalIteratorSymbol: symbol,
  keyIndex: string | number = 0,
  valueIndex: string | number = 1,
) {
  const createIterator = createFastIterator(name, internalIteratorSymbol, keyIndex, valueIndex);

  const properties = {
    keys: {
      writable: true,
      enumerable: true,
      configurable: true,
      value: function keys() {
        brandCheck(this, object);
        return createIterator(this, "key");
      },
    },
    values: {
      writable: true,
      enumerable: true,
      configurable: true,
      value: function values() {
        brandCheck(this, object);
        return createIterator(this, "value");
      },
    },
    entries: {
      writable: true,
      enumerable: true,
      configurable: true,
      value: function entries() {
        brandCheck(this, object);
        return createIterator(this, "key+value");
      },
    },
    forEach: {
      writable: true,
      enumerable: true,
      configurable: true,
      value: function forEach(callbackfn: any, thisArg = globalThis) {
        brandCheck(this, object);
        checkRequiredArguments(arguments, 1, `Failed to execute 'forEach' on '${name}'`);
        if (typeof callbackfn !== "function") {
          throw new TypeError(
            `Failed to execute 'forEach' on '${name}': parameter 1 is not of type 'Function'.`,
          );
        }
        for (const { 0: key, 1: value } of createIterator(this, "key+value")) {
          callbackfn.call(thisArg, value, key, this);
        }
      },
    },
  };
  return Object.defineProperties(object.prototype, {
    ...properties,
    [Symbol.iterator]: {
      writable: true,
      enumerable: false,
      configurable: true,
      value: properties.entries.value,
    },
  });
}

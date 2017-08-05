import {Module, Mapping, Node, Type, Kind, typeOf, validate} from './thin-ir';

enum WasmType {
  I32 = -1,
  I64 = -2,
  F32 = -3,
  F64 = -4,
  Func = -32,
}

enum WasmExternalKind {
  Function,
  Table,
  Memory,
  Global,
}

enum WasmSection {
  Type = 1,
  Import,
  Function,
  Table,
  Memory,
  Global,
  Export,
  Start,
  Element,
  Code,
  Data,
}

class ByteArray {
  private _capacity = 1024;
  private _length = 0;
  private _bytes = new Uint8Array(this._capacity);

  length(): number {
    return this._length;
  }

  appendByte(value: number): void {
    if (this._length === this._capacity) {
      this._capacity *= 2;
      this._bytes = new Uint8Array(this._capacity);
    }

    this._bytes[this._length++] = value;
  }

  appendInt(value: number): void {
    this.appendByte(value);
    this.appendByte(value >>> 8);
    this.appendByte(value >>> 16);
    this.appendByte(value >>> 24);
  }

  append(bytes: Uint8Array): void {
    for (let i = 0; i < bytes.length; i++) {
      this.appendByte(bytes[i]);
    }
  }

  appendVarU(value: number): void {
    value >>>= 0;
    do {
      let element = value & 127;
      value >>>= 7;
      if (value !== 0) element |= 128;
      this.appendByte(element);
    } while (value !== 0);
  }

  appendVarS(value: number): void {
    while (true) {
      let element = value & 127;
      value >>= 7;
      let done = value === 0 && (element & 64) == 0 || value === -1 && (element & 64) != 0;
      if (!done) element |= 128;
      this.appendByte(element);
      if (done) break;
    }
  }

  appendUTF8(text: string): void {
    let byteCount = 0;

    for (let pass = 0; pass < 2; pass++) {
      for (let i = 0; i < text.length; i++) {
        let codePoint = text.charCodeAt(i);

        // Decode UTF-16
        if (codePoint >= 0xD800 && codePoint <= 0xDBFF && i + 1 < text.length) {
          const extra = text.charCodeAt(i);

          if ((extra & 0xFC00) === 0xDC00) {
            codePoint = ((codePoint & 0x3FF) << 10) + (extra & 0x3FF) + 0x10000;
            i++;
          }
        }

        // Measure UTF-8 size
        if (pass === 0) {
          if ((codePoint & 0xFFFFFF80) === 0) byteCount += 1;
          else if ((codePoint & 0xFFFFF800) === 0) byteCount += 2;
          else if ((codePoint & 0xFFFF0000) === 0) byteCount += 3;
          else if ((codePoint & 0xFFE00000) === 0) byteCount += 4;
          else throw new Error(`Invalid UTF-8 code point: ${codePoint}`);
        }

        // Encode UTF-8
        else {
          if ((codePoint & 0xFFFFFF80) === 0) {
            this.appendByte(codePoint);
          } else {
            if ((codePoint & 0xFFFFF800) === 0) {
              this.appendByte(((codePoint >>> 6) & 0x1F) | 0xC0);
            } else {
              if ((codePoint & 0xFFFF0000) === 0) {
                this.appendByte(((codePoint >>> 12) & 0x0F) | 0xE0);
              } else {
                this.appendByte(((codePoint >>> 18) & 0x07) | 0xF0);
                this.appendByte(((codePoint >>> 12) & 0x3F) | 0x80);
              }
              this.appendByte(((codePoint >>> 6) & 0x3F) | 0x80);
            }
            this.appendByte((codePoint & 0x3F) | 0x80);
          }
        }
      }

      if (pass === 0) this.appendVarU(byteCount);
    }
  }

  toUint8Array(): Uint8Array {
    return this._bytes.subarray(0, this._length);
  }
}

interface Section {
  id: number;
  data: ByteArray;
}

interface FunctionType {
  argTypes: Type[];
  returnType: Type;
}

export function compile(module: Module): Uint8Array {
  const {data, imports, functions} = module;
  const mapping = validate(module);
  const typeSection: Section = {id: WasmSection.Type, data: new ByteArray()};
  const importSection: Section = {id: WasmSection.Import, data: new ByteArray()};
  const functionSection: Section = {id: WasmSection.Function, data: new ByteArray()};
  const exportSection: Section = {id: WasmSection.Export, data: new ByteArray()};
  const codeSection: Section = {id: WasmSection.Code, data: new ByteArray()};
  const functionTypes: FunctionType[] = [];
  const bytes = new ByteArray();

  function indexOfFunctionType(argTypes: Type[], returnType: Type): number {
  next:
    for (let i = 0; i < functionTypes.length; i++) {
      const type = functionTypes[i];
      if (type.returnType === returnType && type.argTypes.length === argTypes.length) {
        for (let j = 0; j < argTypes.length; j++) {
          if (argTypes[j] !== type.argTypes[j]) {
            continue next;
          }
        }
        return i;
      }
    }

    functionTypes.push({argTypes, returnType});
    return functionTypes.length - 1;
  }

  importSection.data.appendVarU(imports.length);
  functionSection.data.appendVarU(functions.length);
  codeSection.data.appendVarU(functions.length);

  for (const item of imports) {
    importSection.data.appendUTF8(item.location);
    importSection.data.appendUTF8(item.name);
    importSection.data.appendByte(WasmExternalKind.Function);
    importSection.data.appendVarU(indexOfFunctionType(item.argTypes, item.returnType));
  }

  let exportCount = 0;

  for (const item of functions) {
    functionSection.data.appendVarU(indexOfFunctionType(item.argTypes, item.returnType));
    if (item.isExported) exportCount++;

    const body = new ByteArray();

    if (item.localI32s) {
      body.appendVarU(1);
      body.appendVarU(item.localI32s);
      body.appendVarS(WasmType.I32);
    } else {
      body.appendVarU(0);
    }

    if (item.returnType === Type.I32) {
      body.appendByte(0x41);
      body.appendVarU(0);
    }

    body.appendByte(0x0B);

    codeSection.data.appendVarU(body.length());
    codeSection.data.append(body.toUint8Array());
  }

  exportSection.data.appendVarU(exportCount);

  for (let i = 0; i < functions.length; i++) {
    const item = functions[i];
    if (!item.isExported) continue;
    exportSection.data.appendUTF8(item.name);
    exportSection.data.appendByte(WasmExternalKind.Function);
    exportSection.data.appendVarU(i);
  }

  bytes.appendInt(0x6d736100);
  bytes.appendInt(0x1);

  typeSection.data.appendVarU(functionTypes.length);

  for (const type of functionTypes) {
    typeSection.data.appendVarS(WasmType.Func);
    typeSection.data.appendVarU(type.argTypes.length);

    for (const arg of type.argTypes) {
      switch (arg) {
        case Type.I32: {
          typeSection.data.appendVarS(WasmType.I32);
          break;
        }

        default: {
          throw new Error(`Unsupported argument type: ${Type[arg]}`);
        }
      }
    }

    switch (type.returnType) {
      case Type.I32: {
        typeSection.data.appendVarU(1);
        typeSection.data.appendVarS(WasmType.I32);
        break;
      }

      case Type.Void: {
        typeSection.data.appendVarU(0);
        break;
      }
    }
  }

  for (const section of [typeSection, importSection, functionSection, exportSection, codeSection]) {
    bytes.appendVarU(section.id);
    bytes.appendVarU(section.data.length());
    bytes.append(section.data.toUint8Array());
  }

  return new Uint8Array(bytes.toUint8Array());
}

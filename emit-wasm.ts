import {Module, Mapping, Node, Type, Kind, typeOf, validate} from './thin-ir';

enum WasmType {
  I32 = -0x01,
  I64 = -0x02,
  F32 = -0x03,
  F64 = -0x04,
  AnyFunc = -0x10,
  Func = -0x20,
  Void = -0x40,
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

enum WasmOp {
  // Control flow operators
  Unreachable = 0x00,
  Nop = 0x01,
  Block = 0x02,
  Loop = 0x03,
  If = 0x04,
  Else = 5,
  End = 0x0B,
  Br = 0x0C,
  BrIf = 0x0D,
  BrTable = 0x0E,
  Return = 0x0F,

  // Call operators
  Call = 0x10,
  CallIndirect = 0x11,

  // Parametric operators
  Drop = 0x1A,
  Select = 0x1B,

  // Variable access
  GetLocal = 0x20,
  SetLocal = 0x21,
  TeeLocal = 0x22,
  GetGlobal = 0x23,
  SetGlobal = 0x24,

  // Memory-related operators
  I32_Load = 0x28,
  I64_Load = 0x29,
  F32_Load = 0x2A,
  F64_Load = 0x2B,
  I32_Load8_S = 0x2C,
  I32_Load8_U = 0x2D,
  I32_Load16_S = 0x2E,
  I32_Load16_U = 0x2F,
  I64_Load8_S = 0x30,
  I64_Load8_U = 0x31,
  I64_Load16_S = 0x32,
  I64_Load16_U = 0x33,
  I64_Load32_S = 0x34,
  I64_Load32_U = 0x35,
  I32_Store = 0x36,
  I64_Store = 0x37,
  F32_Store = 0x38,
  F64_Store = 0x39,
  I32_Store8 = 0x3A,
  I32_Store16 = 0x3B,
  I64_Store8 = 0x3C,
  I64_Store16 = 0x3D,
  I64_Store32 = 0x3E,
  CurrentMemory = 0x3F,
  GrowMemory = 0x40,

  // Constants
  I32_Const = 0x41,
  I64_Const = 0x42,
  F32_Const = 0x43,
  F64_Const = 0x44,

  // Comparison operators
  I32_Eqz = 0x45,
  I32_Eq = 0x46,
  I32_Ne = 0x47,
  I32_Lt_S = 0x48,
  I32_Lt_U = 0x49,
  I32_Gt_S = 0x4A,
  I32_Gt_U = 0x4B,
  I32_Le_S = 0x4C,
  I32_Le_U = 0x4D,
  I32_Ge_S = 0x4E,
  I32_Ge_U = 0x4F,
  I64_Eqz = 0x50,
  I64_Eq = 0x51,
  I64_Ne = 0x52,
  I64_Lt_S = 0x53,
  I64_Lt_U = 0x54,
  I64_Gt_S = 0x55,
  I64_Gt_U = 0x56,
  I64_Le_S = 0x57,
  I64_Le_U = 0x58,
  I64_Ge_S = 0x59,
  I64_Ge_U = 0x5A,
  F32_Eq = 0x5B,
  F32_Ne = 0x5C,
  F32_Lt = 0x5D,
  F32_Gt = 0x5E,
  F32_Le = 0x5F,
  F32_Ge = 0x60,
  F64_Eq = 0x61,
  F64_Ne = 0x62,
  F64_Lt = 0x63,
  F64_Gt = 0x64,
  F64_Le = 0x65,
  F64_Ge = 0x66,

  // Numeric operators
  I32_Clz = 0x67,
  I32_Ctz = 0x68,
  I32_Popcnt = 0x69,
  I32_Add = 0x6A,
  I32_Sub = 0x6B,
  I32_Mul = 0x6C,
  I32_Div_S = 0x6D,
  I32_Div_U = 0x6E,
  I32_Rem_S = 0x6F,
  I32_Rem_U = 0x70,
  I32_And = 0x71,
  I32_Or = 0x72,
  I32_Xor = 0x73,
  I32_Shl = 0x74,
  I32_Shr_S = 0x75,
  I32_Shr_U = 0x76,
  I32_Rotl = 0x77,
  I32_Rotr = 0x78,
  I64_Clz = 0x79,
  I64_Ctz = 0x7A,
  I64_Popcnt = 0x7B,
  I64_Add = 0x7C,
  I64_Sub = 0x7D,
  I64_Mul = 0x7E,
  I64_Div_S = 0x7F,
  I64_Div_U = 0x80,
  I64_Rem_S = 0x81,
  I64_Rem_U = 0x82,
  I64_And = 0x83,
  I64_Or = 0x84,
  I64_Xor = 0x85,
  I64_Shl = 0x86,
  I64_Shr_S = 0x87,
  I64_Shr_U = 0x88,
  I64_Rotl = 0x89,
  I64_Rotr = 0x8A,
  F32_Abs = 0x8B,
  F32_Neg = 0x8C,
  F32_Ceil = 0x8D,
  F32_Floor = 0x8E,
  F32_Trunc = 0x8F,
  F32_Nearest = 0x90,
  F32_Sqrt = 0x91,
  F32_Add = 0x92,
  F32_Sub = 0x93,
  F32_Mul = 0x94,
  F32_Div = 0x95,
  F32_Min = 0x96,
  F32_Max = 0x97,
  F32_Copysign = 0x98,
  F64_Abs = 0x99,
  F64_Neg = 0x9A,
  F64_Ceil = 0x9B,
  F64_Floor = 0x9C,
  F64_Trunc = 0x9D,
  F64_Nearest = 0x9E,
  F64_Sqrt = 0x9F,
  F64_Add = 0xA0,
  F64_Sub = 0xA1,
  F64_Mul = 0xA2,
  F64_Div = 0xA3,
  F64_Min = 0xA4,
  F64_Max = 0xA5,
  F64_Copysign = 0xA6,

  // Conversions
  I32_Wrap_I64 = 0xA7,
  I32_Trunc_S_F32 = 0xA8,
  I32_Trunc_U_F32 = 0xA9,
  I32_Trunc_S_F64 = 0xAA,
  I32_Trunc_U_F64 = 0xAB,
  I64_Extend_S_I32 = 0xAC,
  I64_Extend_U_I32 = 0xAD,
  I64_Trunc_S_F32 = 0xAE,
  I64_Trunc_U_F32 = 0xAF,
  I64_Trunc_S_F64 = 0xB0,
  I64_Trunc_U_F64 = 0xB1,
  F32_Convert_S_I32 = 0xB2,
  F32_Convert_U_I32 = 0xB3,
  F32_Convert_S_I64 = 0xB4,
  F32_Convert_U_I64 = 0xB5,
  F32_Demote_F64 = 0xB6,
  F64_Convert_S_I32 = 0xB7,
  F64_Convert_U_I32 = 0xB8,
  F64_Convert_S_I64 = 0xB9,
  F64_Convert_U_I64 = 0xBA,
  F64_Promote_F32 = 0xBB,

  // Reinterpretations
  I32_Reinterpret_F32 = 0xBC,
  I64_Reinterpret_F64 = 0xBD,
  I32_Reinterpret_I32 = 0xBE,
  I64_Reinterpret_I64 = 0xBF,
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
  const memorySection: Section = {id: WasmSection.Memory, data: new ByteArray()};
  const codeSection: Section = {id: WasmSection.Code, data: new ByteArray()};
  const dataSection: Section = {id: WasmSection.Data, data: new ByteArray()};
  const functionIndexFromID: {[id: number]: number} = Object.create(null);
  const importIndexFromID: {[id: number]: number} = Object.create(null);
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

  memorySection.data.appendVarU(1);
  memorySection.data.appendVarU(0);
  memorySection.data.appendVarU(module.data.length + 0xFFFF >>> 16);

  let dataStart = 0;
  let dataEnd = data.length;

  while (dataStart < dataEnd && !data[dataStart]) dataStart++;
  while (dataStart < dataEnd && !data[dataEnd - 1]) dataEnd--;

  if (dataStart < dataEnd) {
    dataSection.data.appendVarU(1);
    dataSection.data.appendVarU(0);
    dataSection.data.appendByte(WasmOp.I32_Const);
    dataSection.data.appendVarS(dataStart);
    dataSection.data.appendByte(WasmOp.End);
    dataSection.data.appendVarU(dataEnd - dataStart);
    for (let i = dataStart; i < dataEnd; i++) {
      dataSection.data.appendByte(data[i]);
    }
  }

  importSection.data.appendVarU(imports.length);
  functionSection.data.appendVarU(functions.length);
  codeSection.data.appendVarU(functions.length);

  for (let i = 0; i < imports.length; i++) {
    const item = imports[i];
    importIndexFromID[item.id] = i;
    importSection.data.appendUTF8(item.location);
    importSection.data.appendUTF8(item.name);
    importSection.data.appendByte(WasmExternalKind.Function);
    importSection.data.appendVarU(indexOfFunctionType(item.argTypes, item.returnType));
  }

  let exportCount = 1;

  for (let i = 0; i < functions.length; i++) {
    const item = functions[i];
    functionIndexFromID[item.id] = i + imports.length;
    functionSection.data.appendVarU(indexOfFunctionType(item.argTypes, item.returnType));
    if (item.isExported) exportCount++;
  }

  exportSection.data.appendVarU(exportCount);
  exportSection.data.appendUTF8("memory");
  exportSection.data.appendByte(WasmExternalKind.Memory);
  exportSection.data.appendVarU(0);

  for (let i = 0; i < functions.length; i++) {
    const item = functions[i];

    if (item.isExported) {
      exportSection.data.appendUTF8(item.name);
      exportSection.data.appendByte(WasmExternalKind.Function);
      exportSection.data.appendVarU(i + imports.length);
    }

    const body = new ByteArray();

    if (item.localI32s) {
      body.appendVarU(1);
      body.appendVarU(item.localI32s);
      body.appendVarS(WasmType.I32);
    } else {
      body.appendVarU(0);
    }

    const compileVoidNode = (node: Node) => {
      compileNode(node);

      if (typeOf(node.kind) !== Type.Void) {
        body.appendByte(WasmOp.Drop);
      }
    }

    const compileNode = (node: Node) => {
      switch (node.kind) {
        case Kind.Void_Call:
        case Kind.I32_Call: {
          for (const child of node.children) {
            compileNode(child);
          }
          body.appendByte(WasmOp.Call);
          body.appendVarU(functionIndexFromID[node.value]);
          break;
        }

        case Kind.Void_CallImport:
        case Kind.I32_CallImport: {
          for (const child of node.children) {
            compileNode(child);
          }
          body.appendByte(WasmOp.Call);
          body.appendVarU(importIndexFromID[node.value]);
          break;
        }

        case Kind.Void_Const: {
          body.appendByte(WasmOp.Nop);
          break;
        }

        case Kind.I32_Const: {
          body.appendByte(WasmOp.I32_Const);
          body.appendVarS(node.value);
          break;
        }

        case Kind.I32_Load: {
          compileNode(node.children[0]);
          body.appendByte(WasmOp.I32_Load);
          body.appendVarU(2);
          body.appendVarU(node.value);
          break;
        }

        case Kind.I32_Load8S: {
          compileNode(node.children[0]);
          body.appendByte(WasmOp.I32_Load8_S);
          body.appendVarU(0);
          body.appendVarU(0);
          break;
        }

        case Kind.I32_Load8U: {
          compileNode(node.children[0]);
          body.appendByte(WasmOp.I32_Load8_U);
          body.appendVarU(0);
          body.appendVarU(0);
          break;
        }

        case Kind.I32_Load16S: {
          compileNode(node.children[0]);
          body.appendByte(WasmOp.I32_Load16_S);
          body.appendVarU(1);
          body.appendVarU(0);
          break;
        }

        case Kind.I32_Load16U: {
          compileNode(node.children[0]);
          body.appendByte(WasmOp.I32_Load16_U);
          body.appendVarU(1);
          body.appendVarU(0);
          break;
        }

        case Kind.I32_LoadLocal: {
          body.appendByte(WasmOp.GetLocal);
          body.appendVarU(node.value);
          break;
        }

        case Kind.I32_Store: {
          compileNode(node.children[0]);
          compileNode(node.children[1]);
          body.appendByte(WasmOp.I32_Store);
          body.appendVarU(2);
          body.appendVarU(0);
          break;
        }

        case Kind.I32_Store8: {
          compileNode(node.children[0]);
          compileNode(node.children[1]);
          body.appendByte(WasmOp.I32_Store8);
          body.appendVarU(0);
          body.appendVarU(0);
          break;
        }

        case Kind.I32_Store16: {
          compileNode(node.children[0]);
          compileNode(node.children[1]);
          body.appendByte(WasmOp.I32_Store16);
          body.appendVarU(1);
          body.appendVarU(0);
          break;
        }

        case Kind.I32_StoreLocal: {
          compileNode(node.children[0]);
          body.appendByte(WasmOp.SetLocal);
          body.appendVarU(node.value);
          break;
        }

        case Kind.I32_Add: {
          compileNode(node.children[0]);
          compileNode(node.children[1]);
          body.appendByte(WasmOp.I32_Add);
          break;
        }

        case Kind.I32_And: {
          compileNode(node.children[0]);
          compileNode(node.children[1]);
          body.appendByte(WasmOp.I32_And);
          break;
        }

        case Kind.I32_DivS: {
          compileNode(node.children[0]);
          compileNode(node.children[1]);
          body.appendByte(WasmOp.I32_Div_S);
          break;
        }

        case Kind.I32_DivU: {
          compileNode(node.children[0]);
          compileNode(node.children[1]);
          body.appendByte(WasmOp.I32_Div_U);
          break;
        }

        case Kind.I32_Eq: {
          compileNode(node.children[0]);
          compileNode(node.children[1]);
          body.appendByte(WasmOp.I32_Eq);
          break;
        }

        case Kind.I32_GeS: {
          compileNode(node.children[0]);
          compileNode(node.children[1]);
          body.appendByte(WasmOp.I32_Ge_S);
          break;
        }

        case Kind.I32_GeU: {
          compileNode(node.children[0]);
          compileNode(node.children[1]);
          body.appendByte(WasmOp.I32_Ge_U);
          break;
        }

        case Kind.I32_GtS: {
          compileNode(node.children[0]);
          compileNode(node.children[1]);
          body.appendByte(WasmOp.I32_Gt_S);
          break;
        }

        case Kind.I32_GtU: {
          compileNode(node.children[0]);
          compileNode(node.children[1]);
          body.appendByte(WasmOp.I32_Gt_U);
          break;
        }

        case Kind.I32_LeS: {
          compileNode(node.children[0]);
          compileNode(node.children[1]);
          body.appendByte(WasmOp.I32_Le_S);
          break;
        }

        case Kind.I32_LeU: {
          compileNode(node.children[0]);
          compileNode(node.children[1]);
          body.appendByte(WasmOp.I32_Le_U);
          break;
        }

        case Kind.I32_LtS: {
          compileNode(node.children[0]);
          compileNode(node.children[1]);
          body.appendByte(WasmOp.I32_Lt_S);
          break;
        }

        case Kind.I32_LtU: {
          compileNode(node.children[0]);
          compileNode(node.children[1]);
          body.appendByte(WasmOp.I32_Lt_U);
          break;
        }

        case Kind.I32_Mul: {
          compileNode(node.children[0]);
          compileNode(node.children[1]);
          body.appendByte(WasmOp.I32_Mul);
          break;
        }

        case Kind.I32_Ne: {
          compileNode(node.children[0]);
          compileNode(node.children[1]);
          body.appendByte(WasmOp.I32_Ne);
          break;
        }

        case Kind.I32_Or: {
          compileNode(node.children[0]);
          compileNode(node.children[1]);
          body.appendByte(WasmOp.I32_Or);
          break;
        }

        case Kind.I32_RemS: {
          compileNode(node.children[0]);
          compileNode(node.children[1]);
          body.appendByte(WasmOp.I32_Rem_S);
          break;
        }

        case Kind.I32_RemU: {
          compileNode(node.children[0]);
          compileNode(node.children[1]);
          body.appendByte(WasmOp.I32_Rem_U);
          break;
        }

        case Kind.I32_Shl: {
          compileNode(node.children[0]);
          compileNode(node.children[1]);
          body.appendByte(WasmOp.I32_Shl);
          break;
        }

        case Kind.I32_ShrS: {
          compileNode(node.children[0]);
          compileNode(node.children[1]);
          body.appendByte(WasmOp.I32_Shr_S);
          break;
        }

        case Kind.I32_ShrU: {
          compileNode(node.children[0]);
          compileNode(node.children[1]);
          body.appendByte(WasmOp.I32_Shr_U);
          break;
        }

        case Kind.I32_Sub: {
          compileNode(node.children[0]);
          compileNode(node.children[1]);
          body.appendByte(WasmOp.I32_Sub);
          break;
        }

        case Kind.I32_Xor: {
          compileNode(node.children[0]);
          compileNode(node.children[1]);
          body.appendByte(WasmOp.I32_Xor);
          break;
        }

        case Kind.I32_Select: {
          compileNode(node.children[0]);
          body.appendByte(WasmOp.If);
          body.appendVarS(WasmType.I32);
          compileNode(node.children[1]);
          body.appendByte(WasmOp.Else);
          compileNode(node.children[2]);
          body.appendByte(WasmOp.End);
          break;
        }

        case Kind.Flow_Block: {
          for (const child of node.children) {
            compileVoidNode(child);
          }
          break;
        }

        case Kind.Flow_If: {
          compileNode(node.children[0]);
          body.appendByte(WasmOp.If);
          body.appendVarS(WasmType.Void);
          compileVoidNode(node.children[1]);
          body.appendByte(WasmOp.Else);
          compileVoidNode(node.children[2]);
          body.appendByte(WasmOp.End);
          break;
        }

        case Kind.Flow_Return: {
          compileNode(node.children[0]);
          body.appendByte(WasmOp.Return);
          break;
        }

        case Kind.Flow_While: {
          compileNode(node.children[0]);
          body.appendByte(WasmOp.If);
          body.appendVarS(WasmType.Void);
          body.appendByte(WasmOp.Loop);
          body.appendVarS(WasmType.Void);
          compileVoidNode(node.children[1]);
          compileNode(node.children[0]);
          body.appendByte(WasmOp.BrIf);
          body.appendVarU(0);
          body.appendByte(WasmOp.End);
          body.appendByte(WasmOp.End);
          break;
        }
      }
    };

    compileNode(item.body);

    if (item.returnType === Type.I32) {
      body.appendByte(WasmOp.I32_Const);
      body.appendVarS(0);
    }

    body.appendByte(WasmOp.End);

    codeSection.data.appendVarU(body.length());
    codeSection.data.append(body.toUint8Array());
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

  for (const section of [typeSection, importSection, functionSection, memorySection, exportSection, codeSection, dataSection]) {
    bytes.appendVarU(section.id);
    bytes.appendVarU(section.data.length());
    bytes.append(section.data.toUint8Array());
  }

  return new Uint8Array(bytes.toUint8Array());
}

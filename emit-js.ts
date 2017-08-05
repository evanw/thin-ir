import {Module, Mapping, Node, Type, Kind, typeOf, validate} from './thin-ir';

function joinVariables(prefix: string, count: number, offset: number): string {
  let text = '';

  for (let i = 0; i < count; i++) {
    if (i > 0) text += ', ';
    text += prefix + (i + offset);
  }

  return text;
}

export function compile(module: Module): Uint8Array {
  const {data, imports, functions} = module;
  const mapping = validate(module);
  let indent = '    ';
  let text = '';

  text += '(function(imports) {\n';
  text += `  var buffer = new ArrayBuffer(${data.length});\n`;
  text += '  var s1 = new Int8Array(buffer);\n';
  text += '  var u1 = new Uint8Array(buffer);\n';
  text += '  var s2 = new Int16Array(buffer);\n';
  text += '  var u2 = new Uint16Array(buffer);\n';
  text += '  var s4 = new Int32Array(buffer);\n';
  text += '  var exports = {u8: u1};\n';

  let dataStart = 0;
  let dataEnd = data.length;

  while (dataStart < dataEnd && !data[dataStart]) dataStart++;
  while (dataStart < dataEnd && !data[dataEnd - 1]) dataEnd--;

  if (dataStart < dataEnd) {
    text += '  u1.set([';
    for (let j = dataStart; j < dataEnd; j++) {
      if (j > dataStart) text += ', ';
      text += data[j];
    }
    text += `], ${dataStart});\n`;
  }

  function mangle(name: string): string {
    return name.replace(/[^A-Za-z0-9_]/g, '');
  }

  const importNames: {[id: number]: string} = {};
  const functionNames: {[id: number]: string} = {};

  for (const {id, location, name} of imports) {
    importNames[id] = `i${id}_${mangle(name)}`;
    text += `  var ${importNames[id]} = imports[${JSON.stringify(location)}][${JSON.stringify(name)}];\n`;
  }

  for (const {id, name} of functions) {
    functionNames[id] = `f${id}_${mangle(name)}`;
  }

  function emitOffset(offset: number): void {
    if (!offset) return;
    text += ` + ${offset}`;
  }

  function emitStatement(node: Node): void {
    if (typeOf(node.kind) !== Type.Void) {
      text += indent;
    }

    emit(node);

    if (typeOf(node.kind) !== Type.Void) {
      text += ';\n';
    }
  }

  function emit({kind, value, children}: Node): void {
    switch (kind) {
      case Kind.Void_Call: {
        text += `${indent}${functionNames[value]}(`;
        for (let i = 0; i < children.length; i++) {
          if (i > 0) text += ', ';
          emit(children[i]);
        }
        text += ');\n';
        break;
      }

      case Kind.Void_CallImport: {
        text += `${indent}${importNames[value]}(`;
        for (let i = 0; i < children.length; i++) {
          if (i > 0) text += ', ';
          emit(children[i]);
        }
        text += ');\n';
        break;
      }

      case Kind.Void_Const: {
        break;
      }

      case Kind.I32_Const: {
        text += `${value}`;
        break;
      }

      case Kind.I32_Load: {
        text += 's4[';
        emit(children[0]);
        emitOffset(value);
        text += ' >> 2]';
        break;
      }

      case Kind.I32_Load8S: {
        text += 's1[';
        emit(children[0]);
        emitOffset(value);
        text += ']';
        break;
      }

      case Kind.I32_Load8U: {
        text += 'u1[';
        emit(children[0]);
        emitOffset(value);
        text += ']';
        break;
      }

      case Kind.I32_Load16S: {
        text += 's2[';
        emit(children[0]);
        emitOffset(value);
        text += ' >> 1]';
        break;
      }

      case Kind.I32_Load16U: {
        text += 'u2[';
        emit(children[0]);
        emitOffset(value);
        text += ' >> 1]';
        break;
      }

      case Kind.I32_LoadLocal: {
        text += `l${value}`;
        break;
      }

      case Kind.I32_Store: {
        text += `${indent}s4[`;
        emit(children[0]);
        emitOffset(value);
        text += ' >> 2] = ';
        emit(children[1]);
        text += ';\n';
        break;
      }

      case Kind.I32_Store8: {
        text += `${indent}s1[`;
        emit(children[0]);
        emitOffset(value);
        text += '] = ';
        emit(children[1]);
        text += ';\n';
        break;
      }

      case Kind.I32_Store16: {
        text += `${indent}s2[`;
        emit(children[0]);
        emitOffset(value);
        text += ' >> 1] = ';
        emit(children[1]);
        text += ';\n';
        break;
      }

      case Kind.I32_StoreLocal: {
        text += `${indent}l${value} = `;
        emit(children[0]);
        text += ';\n';
        break;
      }

      case Kind.I32_Add: {
        text += '(';
        emit(children[0]);
        text += ' + ';
        emit(children[1]);
        text += ' | 0)';
        break;
      }

      case Kind.I32_And: {
        text += '(';
        emit(children[0]);
        text += ' & ';
        emit(children[1]);
        text += ')';
        break;
      }

      case Kind.I32_DivS: {
        text += '(';
        emit(children[0]);
        text += ' / ';
        emit(children[1]);
        text += ' | 0)';
        break;
      }

      case Kind.I32_DivU: {
        text += '((';
        emit(children[0]);
        text += ' >>> 0) / (';
        emit(children[1]);
        text += ' >>> 0) | 0)';
        break;
      }

      case Kind.I32_Eq: {
        text += '(';
        emit(children[0]);
        text += ' === ';
        emit(children[1]);
        text += ')';
        break;
      }

      case Kind.I32_GeS: {
        text += '(';
        emit(children[0]);
        text += ' >= ';
        emit(children[1]);
        text += ')';
        break;
      }

      case Kind.I32_GeU: {
        text += '((';
        emit(children[0]);
        text += ' >>> 0) >= (';
        emit(children[1]);
        text += ' >>> 0))';
        break;
      }

      case Kind.I32_GtS: {
        text += '(';
        emit(children[0]);
        text += ' > ';
        emit(children[1]);
        text += ')';
        break;
      }

      case Kind.I32_GtU: {
        text += '((';
        emit(children[0]);
        text += ' >>> 0) > (';
        emit(children[1]);
        text += ' >>> 0))';
        break;
      }

      case Kind.I32_LeS: {
        text += '((';
        emit(children[0]);
        text += ' >>> 0) <= (';
        emit(children[1]);
        text += ' >>> 0))';
        break;
      }

      case Kind.I32_LeU: {
        text += '((';
        emit(children[0]);
        text += ' >>> 0) <= (';
        emit(children[1]);
        text += ' >>> 0))';
        break;
      }

      case Kind.I32_LtS: {
        text += '(';
        emit(children[0]);
        text += ' < ';
        emit(children[1]);
        text += ')';
        break;
      }

      case Kind.I32_LtU: {
        text += '((';
        emit(children[0]);
        text += ' >>> 0) < (';
        emit(children[1]);
        text += ' >>> 0))';
        break;
      }

      case Kind.I32_Mul: {
        text += 'Math.imul(';
        emit(children[0]);
        text += ', ';
        emit(children[1]);
        text += ')';
        break;
      }

      case Kind.I32_Ne: {
        text += '(';
        emit(children[0]);
        text += ' !== ';
        emit(children[1]);
        text += ')';
        break;
      }

      case Kind.I32_Or: {
        text += '(';
        emit(children[0]);
        text += ' | ';
        emit(children[1]);
        text += ')';
        break;
      }

      case Kind.I32_RemS: {
        text += '(';
        emit(children[0]);
        text += ' % ';
        emit(children[1]);
        text += ' | 0)';
        break;
      }

      case Kind.I32_RemU: {
        text += '((';
        emit(children[0]);
        text += ' >>> 0) % (';
        emit(children[1]);
        text += ' >>> 0) | 0)';
        break;
      }

      case Kind.I32_Shl: {
        text += '(';
        emit(children[0]);
        text += ' << ';
        emit(children[1]);
        text += ')';
        break;
      }

      case Kind.I32_ShrS: {
        text += '(';
        emit(children[0]);
        text += ' >> ';
        emit(children[1]);
        text += ')';
        break;
      }

      case Kind.I32_ShrU: {
        text += '(';
        emit(children[0]);
        text += ' >>> ';
        emit(children[1]);
        text += ')';
        break;
      }

      case Kind.I32_Sub: {
        text += '(';
        emit(children[0]);
        text += ' - ';
        emit(children[1]);
        text += ' | 0)';
        break;
      }

      case Kind.I32_Xor: {
        text += '(';
        emit(children[0]);
        text += ' ^ ';
        emit(children[1]);
        text += ')';
        break;
      }

      case Kind.I32_Call: {
        text += `${functionNames[value]}(`;
        for (let i = 0; i < children.length; i++) {
          if (i > 0) text += ', ';
          emit(children[i]);
        }
        text += ')';
        break;
      }

      case Kind.I32_CallImport: {
        text += `(${importNames[value]}(`;
        for (let i = 0; i < children.length; i++) {
          if (i > 0) text += ', ';
          emit(children[i]);
        }
        text += ') | 0)';
        break;
      }

      case Kind.I32_Select: {
        text += '(';
        emit(children[0]);
        text += ' ? ';
        emit(children[1]);
        text += ' : ';
        emit(children[2]);
        text += ')';
        break;
      }

      case Kind.Flow_Block: {
        for (const child of children) {
          emitStatement(child);
        }
        break;
      }

      case Kind.Flow_If: {
        const oldIndent = indent;
        text += `${indent}if (`;
        emit(children[0]);
        text += ') {\n';
        indent += '  ';
        emitStatement(children[1]);
        indent = oldIndent;
        if (children[2].kind !== Kind.Void_Const) {
          text += `${indent}} else {\n`;
          indent += '  ';
          emitStatement(children[2]);
          indent = oldIndent;
        }
        text += `${indent}}\n`;
        break;
      }

      case Kind.Flow_Return: {
        if (typeOf(children[0].kind) === Type.Void) {
          emit(children[0]);
          text += `${indent}return;\n`;
        } else {
          text += `${indent}return `;
          emit(children[0]);
          text += ';\n';
        }
        break;
      }

      case Kind.Flow_While: {
        const oldIndent = indent;
        text += `${indent}while (`;
        emit(children[0]);
        text += ') {\n';
        indent += '  ';
        emitStatement(children[1]);
        indent = oldIndent;
        text += `${indent}}\n`;
        break;
      }
    }
  }

  for (const {name, id, localI32s, argTypes, isExported, body} of functions) {
    text += `  function ${functionNames[id]}(${joinVariables('l', argTypes.length, 0)}) {\n`;

    if (localI32s) {
      text += `    var ${joinVariables('l', localI32s, argTypes.length)};\n`;
    }

    emitStatement(body);

    text += '  }\n';

    if (isExported) {
      text += `  exports[${JSON.stringify(name)}] = ${functionNames[id]};\n`;
    }
  }

  text += '  return exports;\n';
  text += '})';

  const bytes = new Uint8Array(text.length);

  for (let i = 0; i < text.length; i++) {
    bytes[i] = text.charCodeAt(i);
  }

  return bytes;
}

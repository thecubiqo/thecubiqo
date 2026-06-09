function crc32(buf: Buffer) {
  let crc = ~0;
  for (const byte of buf) {
    crc ^= byte;
    for (let k = 0; k < 8; k += 1) {
      crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1));
    }
  }
  return ~crc >>> 0;
}

function writeU16(value: number) {
  const buf = Buffer.alloc(2);
  buf.writeUInt16LE(value);
  return buf;
}

function writeU32(value: number) {
  const buf = Buffer.alloc(4);
  buf.writeUInt32LE(value >>> 0);
  return buf;
}

export function createZip(files: Array<{ name: string; content: string }>) {
  const localParts: Buffer[] = [];
  const centralParts: Buffer[] = [];
  let offset = 0;

  for (const file of files) {
    const name = Buffer.from(file.name);
    const content = Buffer.from(file.content);
    const crc = crc32(content);

    const localHeader = Buffer.concat([
      writeU32(0x04034b50),
      writeU16(20),
      writeU16(0),
      writeU16(0),
      writeU16(0),
      writeU16(0),
      writeU32(crc),
      writeU32(content.length),
      writeU32(content.length),
      writeU16(name.length),
      writeU16(0),
      name,
    ]);

    localParts.push(localHeader, content);

    const centralHeader = Buffer.concat([
      writeU32(0x02014b50),
      writeU16(20),
      writeU16(20),
      writeU16(0),
      writeU16(0),
      writeU16(0),
      writeU16(0),
      writeU32(crc),
      writeU32(content.length),
      writeU32(content.length),
      writeU16(name.length),
      writeU16(0),
      writeU16(0),
      writeU16(0),
      writeU16(0),
      writeU32(0),
      writeU32(offset),
      name,
    ]);
    centralParts.push(centralHeader);
    offset += localHeader.length + content.length;
  }

  const central = Buffer.concat(centralParts);
  const end = Buffer.concat([
    writeU32(0x06054b50),
    writeU16(0),
    writeU16(0),
    writeU16(files.length),
    writeU16(files.length),
    writeU32(central.length),
    writeU32(offset),
    writeU16(0),
  ]);

  return Buffer.concat([...localParts, central, end]);
}

import {
  bigIntToBytes,
  bytesToBigInt,
  clientKeyDecryptor,
  toHexString,
} from './utils';
import { createTfheKeypair } from './tfhe';
import {
  FheBool,
  FheUint4,
  FheUint8,
  FheUint16,
  FheUint32,
  FheUint64,
  FheUint160,
  TfheCompactPublicKey,
} from 'node-tfhe';

describe('decrypt', () => {
  let clientKeySer: Uint8Array;
  let compactPublicKey: TfheCompactPublicKey;

  beforeAll(async () => {
    const { clientKey, publicKey } = createTfheKeypair();
    clientKeySer = clientKey.serialize();
    compactPublicKey = publicKey;
  });

  it('converts a number to bytes', async () => {
    const value = BigInt(28482);
    const bytes = bigIntToBytes(value);
    expect(bytes).toEqual(new Uint8Array([111, 66]));

    const value2 = BigInt(255);
    const bytes2 = bigIntToBytes(value2);
    expect(bytes2).toEqual(new Uint8Array([255]));
  });

  it('converts bytes to number', async () => {
    const value = new Uint8Array([23, 200, 15]);
    const bigint1 = bytesToBigInt(value);
    expect(bigint1.toString()).toBe('1558543');

    const value2 = new Uint8Array([37, 6, 210, 166, 239]);
    const bigint2 = bytesToBigInt(value2);
    expect(bigint2.toString()).toBe('159028258543');

    const value0 = new Uint8Array();
    const bigint0 = bytesToBigInt(value0);
    expect(bigint0.toString()).toBe('0');
  });

  it('decryptor bool', async () => {
    const d = clientKeyDecryptor(clientKeySer);
    const c = FheBool.encrypt_with_compact_public_key(
      true,
      compactPublicKey,
    ).serialize();
    const v = await d.decryptBool(toHexString(c));
    expect(v).toBe(true);
  });

  it('decryptor 4', async () => {
    const d = clientKeyDecryptor(clientKeySer);
    const c = FheUint4.encrypt_with_compact_public_key(
      4,
      compactPublicKey,
    ).serialize();
    const v = await d.decrypt4(toHexString(c));
    expect(v).toBe(4);
  });

  it('decryptor 8', async () => {
    const d = clientKeyDecryptor(clientKeySer);
    const c = FheUint8.encrypt_with_compact_public_key(
      67,
      compactPublicKey,
    ).serialize();
    const v = await d.decrypt8(toHexString(c));
    expect(v).toBe(67);
  });

  it('decryptor 16', async () => {
    const d = clientKeyDecryptor(clientKeySer);
    const c = FheUint16.encrypt_with_compact_public_key(
      1700,
      compactPublicKey,
    ).serialize();
    const v = await d.decrypt16(toHexString(c));
    expect(v).toBe(1700);
  });

  it('decryptor 32', async () => {
    const d = clientKeyDecryptor(clientKeySer);
    const c = FheUint32.encrypt_with_compact_public_key(
      77662,
      compactPublicKey,
    ).serialize();
    const v = await d.decrypt32(toHexString(c));
    expect(v).toBe(77662);
  });

  it('decryptor 64', async () => {
    const d = clientKeyDecryptor(clientKeySer);
    const c = FheUint64.encrypt_with_compact_public_key(
      BigInt(11200),
      compactPublicKey,
    ).serialize();
    const v = await d.decrypt64(toHexString(c));
    expect(v).toBe(BigInt(11200));
  });

  it('decryptor address', async () => {
    const d = clientKeyDecryptor(clientKeySer);
    const c = FheUint160.encrypt_with_compact_public_key(
      BigInt('0x8ba1f109551bd432803012645ac136ddd64dba72'),
      compactPublicKey,
    ).serialize();
    const v = await d.decryptAddress(toHexString(c));
    expect(v).toBe('0x8ba1f109551bd432803012645ac136ddd64dba72');
  });
});

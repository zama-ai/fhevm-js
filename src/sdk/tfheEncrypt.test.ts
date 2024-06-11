import {
  FheBool,
  FheUint4,
  FheUint8,
  FheUint16,
  FheUint32,
  FheUint64,
  CompactFheBoolList,
  CompactFheUint4List,
  CompactFheUint8List,
  CompactFheUint16List,
  CompactFheUint32List,
  CompactFheUint64List,
  CompactFheUint160List,
  TfheCompactPublicKey,
  TfheClientKey,
} from 'node-tfhe';
import { createTfheKeypair } from '../tfhe';
import {
  encryptBool,
  encrypt4,
  encrypt8,
  encrypt16,
  encrypt32,
  encrypt64,
  encryptAddress,
} from './tfheEncrypt';

describe('tfheEncrypt', () => {
  let clientKey: TfheClientKey;
  let publicKey: TfheCompactPublicKey;

  beforeAll(async () => {
    const keypair = createTfheKeypair();
    clientKey = keypair.clientKey;
    publicKey = keypair.publicKey;
  });

  it('encrypt/decrypt 0 bool', async () => {
    const buffer = encryptBool(false, publicKey);
    const compactList = CompactFheBoolList.deserialize(buffer);
    let encryptedList = compactList.expand();
    encryptedList.forEach((v: FheBool) => {
      const decrypted = v.decrypt(clientKey);
      expect(decrypted).toBe(false);
    });
  });

  it('encrypt/decrypt bool', async () => {
    const buffer = encryptBool(true, publicKey);
    const compactList = CompactFheBoolList.deserialize(buffer);
    let encryptedList = compactList.expand();
    encryptedList.forEach((v: FheBool) => {
      const decrypted = v.decrypt(clientKey);
      expect(decrypted).toBe(true);
    });
  });

  it('encrypt/decrypt 0 4bits', async () => {
    const buffer = encrypt4(0, publicKey);
    const compactList = CompactFheUint4List.deserialize(buffer);
    let encryptedList = compactList.expand();
    encryptedList.forEach((v: FheUint4) => {
      const decrypted = v.decrypt(clientKey);
      expect(decrypted).toBe(0);
    });
  });

  it('encrypt/decrypt 4bits', async () => {
    const buffer = encrypt4(7, publicKey);
    const compactList = CompactFheUint4List.deserialize(buffer);
    let encryptedList = compactList.expand();
    encryptedList.forEach((v: FheUint4) => {
      const decrypted = v.decrypt(clientKey);
      expect(decrypted).toBe(7);
    });
  });

  it('encrypt/decrypt 0 8bits', async () => {
    const buffer = encrypt8(0, publicKey);
    const compactList = CompactFheUint8List.deserialize(buffer);
    let encryptedList = compactList.expand();
    encryptedList.forEach((v: FheUint8) => {
      const decrypted = v.decrypt(clientKey);
      expect(decrypted).toBe(0);
    });
  });

  it('encrypt/decrypt 8bits', async () => {
    const buffer = encrypt8(34, publicKey);
    const compactList = CompactFheUint8List.deserialize(buffer);
    let encryptedList = compactList.expand();
    encryptedList.forEach((v: FheUint8) => {
      const decrypted = v.decrypt(clientKey);
      expect(decrypted).toBe(34);
    });
  });

  it('encrypt/decrypt 0 16bits', async () => {
    const buffer = encrypt16(0, publicKey);
    const compactList = CompactFheUint8List.deserialize(buffer);
    let encryptedList = compactList.expand();
    encryptedList.forEach((v: FheUint8) => {
      const decrypted = v.decrypt(clientKey);
      expect(decrypted).toBe(0);
    });
  });

  it('encrypt/decrypt 16bits', async () => {
    const buffer = encrypt16(434, publicKey);
    const compactList = CompactFheUint16List.deserialize(buffer);
    let encryptedList = compactList.expand();
    encryptedList.forEach((v: FheUint16) => {
      const decrypted = v.decrypt(clientKey);
      expect(decrypted).toBe(434);
    });
  });

  it('encrypt/decrypt 0 32bits', async () => {
    const buffer = encrypt32(0, publicKey);
    const compactList = CompactFheUint8List.deserialize(buffer);
    let encryptedList = compactList.expand();
    encryptedList.forEach((v: FheUint8) => {
      const decrypted = v.decrypt(clientKey);
      expect(decrypted).toBe(0);
    });
  });

  it('encrypt/decrypt 32bits', async () => {
    const buffer = encrypt32(30210, publicKey);
    const compactList = CompactFheUint32List.deserialize(buffer);
    let encryptedList = compactList.expand();
    encryptedList.forEach((v: FheUint32) => {
      const decrypted = v.decrypt(clientKey);
      expect(decrypted).toBe(30210);
    });
  });

  it('encrypt/decrypt 0 64bits', async () => {
    const buffer = encrypt64(0, publicKey);
    const compactList = CompactFheUint64List.deserialize(buffer);
    let encryptedList = compactList.expand();
    encryptedList.forEach((v: FheUint64) => {
      const decrypted = v.decrypt(clientKey);
      expect(decrypted.toString()).toBe('0');
    });
  });

  it('encrypt/decrypt 64bits', async () => {
    const buffer = encrypt64(3021094839202949, publicKey);
    const compactList = CompactFheUint64List.deserialize(buffer);
    let encryptedList = compactList.expand();
    encryptedList.forEach((v: FheUint64) => {
      const decrypted = v.decrypt(clientKey);
      expect(decrypted.toString()).toBe('3021094839202949');
    });
  });

  it('encrypt/decrypt bigint 64bits', async () => {
    const buffer = encrypt64(BigInt('18446744073709551615'), publicKey);
    const compactList = CompactFheUint64List.deserialize(buffer);
    let encryptedList = compactList.expand();
    encryptedList.forEach((v: FheUint64) => {
      const decrypted = v.decrypt(clientKey);
      expect(decrypted.toString()).toBe('18446744073709551615');
    });
  });
  it('encrypt/decrypt 0x000... 160bits', async () => {
    const buffer = encryptAddress(
      '0x0000000000000000000000000000000000000000',
      publicKey,
    );
    const compactList = CompactFheUint160List.deserialize(buffer);
    let encryptedList = compactList.expand();
    encryptedList.forEach((v: FheUint64) => {
      const decrypted = v.decrypt(clientKey);
      expect(decrypted.toString()).toBe('0');
    });
  });

  it('encrypt/decrypt 160bits', async () => {
    const buffer = encryptAddress(
      '0x8ba1f109551bd432803012645ac136ddd64dba72',
      publicKey,
    );
    const compactList = CompactFheUint160List.deserialize(buffer);
    let encryptedList = compactList.expand();
    encryptedList.forEach((v: FheUint64) => {
      const decrypted = v.decrypt(clientKey);
      expect(decrypted.toString()).toBe(
        '797161134358056856230896843146392277790002887282',
      );
    });
  });
});

import { createInstance } from './index';
import { publicKey, publicParams } from '../test';
import { bytesToHex } from '../utils';

jest.mock('ethers', () => ({
  JsonRpcProvider: () => ({
    // getSigners: () => ['0x4c102C7cA99d3079fEFF08114d3bad888b9794d9'],
  }),
  isAddress: () => true,
  Contract: () => ({
    getSigners: () => ['0x4c102C7cA99d3079fEFF08114d3bad888b9794d9'],
  }),
}));

describe('index', () => {
  it('creates an instance', async () => {
    const serializedPublicKey = bytesToHex(publicKey.serialize());
    const serializedPublicParams = bytesToHex(
      publicParams[2048].serialize(false),
    );
    const instance = await createInstance({
      aclContractAddress: '0x4c102C7cA99d3079fEFF08114d3bad888b9794d9',
      kmsContractAddress: '0x325ea1b59F28e9e1C51d3B5b47b7D3965CC5D8C8',
      chainId: 1234,
      publicKey: serializedPublicKey,
      publicParams: { 2048: serializedPublicParams },
      networkUrl: 'https://network.com/',
    });
    expect(instance.reencrypt).toBeDefined();
    expect(instance.createEIP712).toBeDefined();
    expect(instance.generateKeypair).toBeDefined();
    expect(instance.createEncryptedInput).toBeDefined();
    expect(instance.getPublicKey()).toBe(serializedPublicKey);
  });

  it('fails to create an instance', async () => {
    const serializedPublicKey = bytesToHex(publicKey.serialize());
    const serializedPublicParams = bytesToHex(
      publicParams[2048].serialize(false),
    );
    await expect(
      createInstance({
        aclContractAddress: '0x4c102C7cA99d3079fEFF08114d3bad888b9794d9',
        kmsContractAddress: '0x325ea1b59F28e9e1C51d3B5b47b7D3965CC5D8C8',
        chainId: BigInt(1234) as any,
        publicKey: serializedPublicKey,
        publicParams: { 2048: serializedPublicParams },
        networkUrl: 'https://',
      }),
    ).rejects.toThrow('chainId must be a number');

    await expect(
      createInstance({
        aclContractAddress: '0x4c102C7cA99d3079fEFF08114d3bad888b9794d9',
        kmsContractAddress: '0x325ea1b59F28e9e1C51d3B5b47b7D3965CC5D8C8',
        chainId: 9000,
        publicKey: 43 as any,
      }),
    ).rejects.toThrow('publicKey must be a string');
  });

});

import { fromHexString } from '../utils';
import { generateKeypair, createEIP712 } from './keypair';
import {
  cryptobox_pk_to_u8vec,
  cryptobox_sk_to_u8vec,
  u8vec_to_cryptobox_pk,
  u8vec_to_cryptobox_sk,
} from 'node-tkms';

describe('token', () => {
  it('generate a valid keypair', async () => {
    const keypair = generateKeypair();

    expect(keypair.publicKey.length).toBe(80);
    expect(keypair.privateKey.length).toBe(80);

    let pkBuf = cryptobox_pk_to_u8vec(
      u8vec_to_cryptobox_pk(fromHexString(keypair.publicKey)),
    );
    expect(40).toBe(pkBuf.length);

    let skBuf = cryptobox_sk_to_u8vec(
      u8vec_to_cryptobox_sk(fromHexString(keypair.privateKey)),
    );
    expect(40).toBe(skBuf.length);
  });

  it('create a valid EIP712', async () => {
    const keypair = generateKeypair();

    const eip712 = createEIP712(
      1234,
      '0x8ba1f109551bd432803012645ac136ddd64dba72',
    )(
      keypair.publicKey,
      ['0x8ba1f109551bd432803012645ac136ddd64dba72'],
      1,
      Date.now(),
      86400,
    );

    expect(eip712.domain.chainId).toBe(1234);
    expect(eip712.domain.name).toBe('DecryptionManager');
    expect(eip712.domain.version).toBe('1');
    expect(eip712.message.publicKey).toBe(`0x${keypair.publicKey}`);
    expect(eip712.primaryType).toBe('UserDecryptRequestVerification');
    expect(eip712.types.UserDecryptRequestVerification.length).toBe(5);
    expect(eip712.types.UserDecryptRequestVerification[0].name).toBe(
      'publicKey',
    );
    expect(eip712.types.UserDecryptRequestVerification[0].type).toBe('bytes');
  });

  it('create a valid EIP712 with delegated accunt', async () => {
    const keypair = generateKeypair();

    const eip712 = createEIP712(
      1234,
      '0x8ba1f109551bd432803012645ac136ddd64dba72',
    )(
      keypair.publicKey,
      ['0x8ba1f109551bd432803012645ac136ddd64dba72'],
      1,
      Date.now(),
      86400,
      '0xa5e1defb98EFe38EBb2D958CEe052410247F4c80',
    );

    expect(eip712.domain.chainId).toBe(1234);
    expect(eip712.domain.name).toBe('DecryptionManager');
    expect(eip712.domain.version).toBe('1');
    expect(eip712.message.publicKey).toBe(`0x${keypair.publicKey}`);
    expect(eip712.message.delegatedAccount).toBe(
      '0xa5e1defb98EFe38EBb2D958CEe052410247F4c80',
    );
    expect(eip712.primaryType).toBe('UserDecryptRequestVerification');

    /* 
     { name: 'publicKey', type: 'bytes' },
          { name: 'contractAddresses', type: 'address[]' },
          { name: 'contractsChainId', type: 'uint256' },
          { name: 'startTimestamp', type: 'uint256' },
          { name: 'durationDays', type: 'uint256' },
          { name: 'delegatedAccount', type: 'address' },
           */
    expect(eip712.types.UserDecryptRequestVerification.length).toBe(6);

    expect(eip712.types.UserDecryptRequestVerification[0].name).toBe(
      'publicKey',
    );
    expect(eip712.types.UserDecryptRequestVerification[0].type).toBe('bytes');
    expect(eip712.types.UserDecryptRequestVerification[1].name).toBe(
      'contractAddresses',
    );
    expect(eip712.types.UserDecryptRequestVerification[1].type).toBe(
      'address[]',
    );

    expect(eip712.types.UserDecryptRequestVerification[2].name).toBe(
      'contractsChainId',
    );
    expect(eip712.types.UserDecryptRequestVerification[2].type).toBe('uint256');

    expect(eip712.types.UserDecryptRequestVerification[3].name).toBe(
      'startTimestamp',
    );
    expect(eip712.types.UserDecryptRequestVerification[3].type).toBe('uint256');

    expect(eip712.types.UserDecryptRequestVerification[4].name).toBe(
      'durationDays',
    );
    expect(eip712.types.UserDecryptRequestVerification[4].type).toBe('uint256');

    expect(eip712.types.UserDecryptRequestVerification[5].name).toBe(
      'delegatedAccount',
    );
    expect(eip712.types.UserDecryptRequestVerification[5].type).toBe('address');
  });

  it('create invalid EIP712', async () => {
    const keypair = generateKeypair();

    expect(() =>
      createEIP712(1234, '0x8ba1f109551bd432803012645ac136ddd64dba72')(
        keypair.publicKey,
        ['99'],
        1,
        Date.now(),
        86400,
      ),
    ).toThrow('Invalid contract address.');
    expect(() =>
      createEIP712(1234, '0x8ba1f109551bd432803012645ac136ddd64dba72')(
        keypair.publicKey,
        ['0x8ba1f109551bd432803012645ac136ddd64dba72'],
        1,
        Date.now(),
        86400,
        '99',
      ),
    ).toThrow('Invalid delegated account.');
  });
});

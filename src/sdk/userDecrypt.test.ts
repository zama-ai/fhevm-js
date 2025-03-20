import { userDecryptRequest } from './userDecrypt';
import fetchMock from '@fetch-mock/core';
import { ethers, solidityPacked } from 'ethers';
import { createEIP712UserDecrypt, EIP712 } from './keypair';

// fetchMock.mockGlobal();

fetchMock.post('https://test-relayer.net/reencrypt', {
  status: 'success',
  response: {},
});

const userKeypair = {
  publicKey:
    '0x2000000000000000f3efe739bc5c1f3ecc75ef238bb281358b6ad60a77a68b67888d8802c53e1c59',
  privateKey:
    '0x20000000000000001c0922c8007e42e2c5f1e6d3221c03703c868cf17636724fe43fb49383a4dfe4',
};

describe('reencrypt', () => {
  it('get reencryption for handle', async () => {
    const reencrypt = userDecryptRequest(
      [],
      9000,
      '0x8ba1f109551bd432803012645ac136ddd64dba72',
      '0xa5e1defb98EFe38EBb2D958CEe052410247F4c80',
      'https://test-relayer.net/',
      new ethers.JsonRpcProvider('https://devnet.zama.ai'),
    );
    // const result = await reencrypt(
    //   BigInt(3333),
    //   userKeypair.privateKey,
    //   userKeypair.publicKey,
    //   '0xccc',
    //   '0x8ba1f109551bd432803012645ac136ddd64dba72',
    //   '0xa5e1defb98EFe38EBb2D958CEe052410247F4c80',
    // );
    // expect(result.toString()).toBe('10');
  });
});

describe('User Decryption Request', () => {
  it('should generate valid EIP-712 signature', async () => {
    const chainId = 654321;
    const verifyingContract = "0x857Ca72A957920Fa0FB138602995839866Bd4005";
    const publicKey = "0x200000000000000022a1fce120d42f4170dc8e6ccfbb11d3cbe2af53ed11e7670ee4087cec3f8067";
    const contractAddresses = ["0x74c085A069fafD4f264B5200847EdB1ade82B3C0"];
    const contractsChainId = 123456;
    const startTimestamp = 1742371207;
    const durationDays = 10;
    
    const typedData = createEIP712UserDecrypt(
      chainId,
      verifyingContract,
      publicKey,
      contractAddresses,
      contractsChainId,
      startTimestamp.toString(),
      durationDays.toString()
    );

    const publicKeyBytes = ethers.getBytes(publicKey);
    console.log(publicKeyBytes.length); // Should also be 40
    expect(publicKeyBytes.length).toBe(40);

    console.log("publicKey bytes length in JS:", ethers.getBytes(publicKey).length);
    console.log("contractAddresses array:", contractAddresses);
    console.log("TypedData domain:", typedData.domain);
    console.log("TypedData message:", typedData.message);

    
    const contractAddressesHash = hashPackedAddresses(contractAddresses);
    console.log("✅ Correct packed contract addresses hash (JS):", contractAddressesHash);
    console.log("Packed contract addresses hash solidity:", "0x6711d094949d201fcd74a06cdaa5e7a51886545f31345ce4c9b1b973a86afbdb");
    

    const publicKeyHashJS = ethers.keccak256(publicKeyBytes);
    console.log("keccak256(publicKey) JS:", publicKeyHashJS);
    console.log("keccak256(publicKey) Solidity:", "0x8b1c58131d87ce37c1a0a4e83dfe139ba43d78dc826badf60a264384c77f9f2f");
    

// Before it was UserDecryptionRequestVerification
    const typeDefinition = "EIP712UserDecryptRequest(bytes publicKey,address[] contractAddresses,uint256 contractsChainId,uint256 startTimestamp,uint256 durationDays)";
    const typeHashJS = ethers.keccak256(ethers.toUtf8Bytes(typeDefinition));
    console.log("EIP712_USER_DECRYPT_REQUEST_TYPE_HASH (JS):", typeHashJS);
    console.log("EIP712_USER_DECRYPT_REQUEST_TYPE_HASH (solidity): 0x0e00510175e72dedf518f1316a1bf0031fa5e2daf706fe5ded235ce3e6b15675");
    
    
    
    
    console.log("domain hash:", ethers.TypedDataEncoder.hashDomain(typedData.domain));
    expect(ethers.TypedDataEncoder.hashDomain(typedData.domain)).toBe("0x7a154f71815825be57bf13243442f8a5bac787c840b57d9ecc5e57998f96ef60");
    
    const digest = computeEIP712Digest(typedData);
    console.log("digest:", digest);
    // from fhevmjs
   expect(digest).toBe("0x4f4f2133d58cbcfb25ce26d76285700a92596255a39e305a5837f1d1fa1b61a1");
   // in solidity
   expect(digest).toBe("0x8681900411f55781e77bfc9a1ef85bb97f1bbbf159803688e7791fdfa375bce4");


//    Debug: userDecryptionRequest called
// ➡️ DebugUint256: contractsChainId Value: 123456
// ➡️ DebugUint256: startTimestamp Value: 1742371207
// ➡️ DebugUint256: durationDays Value: 10
// ➡️ DebugAddress: contractAddress Address: 0x8Fdb26641d14a80FCCBE87BF455338Dd9C539a50
// ➡️ DebugAddress: recovered address Address: 0x9403A2A708a19E6940c5bc3471F54f4FB5C12d57
// ➡️ DebugString: publicKey (as bytes length) Value: 40
// ➡️ DebugBytes32: domain separator
//   raw bytes32 (hex): 0x7a154f71815825be57bf13243442f8a5bac787c840b57d9ecc5e57998f96ef60
// ➡️ DebugBytes32: EIP712_USER_DECRYPT_REQUEST_TYPE_HASH
//   raw bytes32 (hex): 0x0e00510175e72dedf518f1316a1bf0031fa5e2daf706fe5ded235ce3e6b15675
// ➡️ DebugBytes32: digest
//   raw bytes32 (hex): 0x8c59a87907683f547d6ebdd6ff80ca5ade8ce3d30055c3ad97107ca917db0736
// ➡️ DebugBytes32: keccak256(publicKey)
//   raw bytes32 (hex): 0x8b1c58131d87ce37c1a0a4e83dfe139ba43d78dc826badf60a264384c77f9f2f
// ➡️ DebugBytes32: keccak256(addresses)
//   raw bytes32 (hex): 0x6711d094949d201fcd74a06cdaa5e7a51886545f31345ce4c9b1b973a86afbdb
// ➡️ DebugBytes: publicKey Value (hex): 0x2000000000000000f119229d0276d44fe73c32889f140f64ffeb8d4b0b4e898edf6bd1edc119062e
// ➡️ DebugBytes: signature given Value (hex): 0xf4302335d9b837a09091506a1eb2ed87453566463a3feb7fb73e11aea0101c002417bc312314b8773f257d9fba35bcfe4196e0a6cb9659cd5ceebd97817e2ece1b
    // Prepare HTTP request payload
    // const payload = {
    //   ctHandleContractPairs: [/* your data */],
    //   requestValidity: {
    //     startTimestamp: startTimestamp.toString(),
    //     durationDays: durationDays.toString()
    //   },
    //   contractsChainId: contractsChainId.toString(),
    //   contractAddresses: contractAddresses,
    //   userAddress: wallet.address,
    //   signature: signature.slice(2), // Remove 0x prefix
    //   publicKey: publicKey.slice(2)  // Remove 0x prefix
    // };
    
 
  });

//  it('should generate valid EIP-712 signature with string', async () => {
//     const chainId = 654321;
//     const verifyingContract = "0x857Ca72A957920Fa0FB138602995839866Bd4005";
//     const publicKey = "0x200000000000000022a1fce120d42f4170dc8e6ccfbb11d3cbe2af53ed11e7670ee4087cec3f8067";
//     const contractAddresses = ["0x74c085A069fafD4f264B5200847EdB1ade82B3C0"];
//     const contractsChainId = "123456";
//     const startTimestamp = 1742367725;
//     const durationDays = 10;
    
//     const typedData = createEIP712UserDecrypt(
//       chainId,
//       verifyingContract,
//       publicKey,
//       contractAddresses,
//       contractsChainId,
//       startTimestamp.toString(),
//       durationDays.toString()
//     ); 
    
//     const digest = computeEIP712Digest(typedData);
//     console.log("digest with string:", digest);
//     // from fhevmjs
//    expect(digest).toBe("0x4f4f2133d58cbcfb25ce26d76285700a92596255a39e305a5837f1d1fa1b61a1");
//    // in solidity
//    expect(digest).toBe("0x8681900411f55781e77bfc9a1ef85bb97f1bbbf159803688e7791fdfa375bce4");


//     Debug: userDecryptionRequest called
// ➡️ DebugUint256: contractsChainId Value: 123456
// ➡️ DebugUint256: startTimestamp Value: 1742367725
// ➡️ DebugUint256: durationDays Value: 10
// ➡️ DebugAddress: contractAddress Address: 0x74c085A069fafD4f264B5200847EdB1ade82B3C0
// ➡️ DebugAddress: recovered address Address: 0x0AfE6541D817F9D477c4E946eC46f5ECCdC6bADa
// ➡️ DebugString: publicKey (as bytes length) Value: 40
// ➡️ DebugBytes32: digest
//   raw bytes32 (hex): 0x8681900411f55781e77bfc9a1ef85bb97f1bbbf159803688e7791fdfa375bce4
// ➡️ DebugBytes: publicKey Value (hex): 0x200000000000000022a1fce120d42f4170dc8e6ccfbb11d3cbe2af53ed11e7670ee4087cec3f8067
// ➡️ DebugBytes: signature given Value (hex): 0x8b3aef380337ab75bf7d8cc4ad3e8487f56c356d03b9ad56119bd17cb5900ce94abb8d3bf2e7f9b7eae18ca7e1bcbf32443dd7e3f34f2115aa0b55e78fb357bf1c
    
    // Prepare HTTP request payload
    // const payload = {
    //   ctHandleContractPairs: [/* your data */],
    //   requestValidity: {
    //     startTimestamp: startTimestamp.toString(),
    //     durationDays: durationDays.toString()
    //   },
    //   contractsChainId: contractsChainId.toString(),
    //   contractAddresses: contractAddresses,
    //   userAddress: wallet.address,
    //   signature: signature.slice(2), // Remove 0x prefix
    //   publicKey: publicKey.slice(2)  // Remove 0x prefix
    // };
    
 
  // });
});
function computeEIP712Digest(typedData: { domain: any; message: any; primaryType: string; types: any; }) {
  const encoder = ethers.TypedDataEncoder.from(typedData);
  const structHash = encoder.hash(typedData.message);
  const domainSeparator = ethers.TypedDataEncoder.hashDomain(typedData.domain);

  return ethers.keccak256(
    ethers.solidityPacked(
      ["string", "bytes32", "bytes32"],
      ["\x19\x01", domainSeparator, structHash]
    )
  );
}


function hashPackedAddresses(addresses:any) {
  const packed = addresses.map((addr: any) =>
    ethers.solidityPacked(["address"], [addr]).slice(2)
  ).join("");
  return ethers.keccak256("0x" + packed);
}
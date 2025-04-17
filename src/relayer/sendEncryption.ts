import { getAddress, isAddress } from 'ethers';
import { TfheCompactPublicKey, CompactPkeCrs } from 'node-tfhe';

import { fromHexString, numberToHex, toHexString } from '../utils';
import {
  createEncryptedInput as createEncryptedInput,
  EncryptedInput,
} from '../sdk/encrypt';
import { ENCRYPTION_TYPES } from '../sdk/encryptionTypes';
import { computeHandles } from './handles';

type EncryptionTypes = keyof typeof ENCRYPTION_TYPES;
export const currentCiphertextVersion = () => {
  return 0;
};

export type FhevmRelayerInputProofResponse = {
  response: {
    handles: string[];
    signatures: string[];
  };
  status: string;
};

export type RelayerEncryptedInputInternal = RelayerEncryptedInput & {
  _input: EncryptedInput;
};

export type RelayerEncryptedInput = {
  addBool: (value: boolean | number | bigint) => RelayerEncryptedInput;
  add8: (value: number | bigint) => RelayerEncryptedInput;
  add16: (value: number | bigint) => RelayerEncryptedInput;
  add32: (value: number | bigint) => RelayerEncryptedInput;
  add64: (value: number | bigint) => RelayerEncryptedInput;
  add128: (value: number | bigint) => RelayerEncryptedInput;
  add256: (value: number | bigint) => RelayerEncryptedInput;
  addBytes64: (value: Uint8Array) => RelayerEncryptedInput;
  addBytes128: (value: Uint8Array) => RelayerEncryptedInput;
  addBytes256: (value: Uint8Array) => RelayerEncryptedInput;
  addAddress: (value: string) => RelayerEncryptedInput;
  getBits: () => EncryptionTypes[];
  encrypt: () => Promise<{
    handles: Uint8Array[];
    inputProof: Uint8Array;
  }>;
};

export type PublicParams<T = CompactPkeCrs> = {
  [key in EncryptionTypes]?: { publicParams: T; publicParamsId: string };
};

export const createRelayerEncryptedInput =
  (
    aclContractAddress: string,
    chainId: number,
    relayerUrl: string,
    tfheCompactPublicKey: TfheCompactPublicKey,
    publicParams: PublicParams,
  ) =>
  (contractAddress: string, userAddress: string): RelayerEncryptedInputInternal => {
    if (!isAddress(contractAddress)) {
      throw new Error('Contract address is not a valid address.');
    }

    if (!isAddress(userAddress)) {
      throw new Error('User address is not a valid address.');
    }

    const input = createEncryptedInput({
      aclContractAddress,
      chainId,
      tfheCompactPublicKey,
      publicParams,
      contractAddress,
      userAddress,
    });

    return {
      _input: input,
      addBool(value: number | bigint | boolean) {
        input.addBool(value);
        return this;
      },
      add8(value: number | bigint) {
        input.add8(value);
        return this;
      },
      add16(value: number | bigint) {
        input.add16(value);
        return this;
      },
      add32(value: number | bigint) {
        input.add32(value);
        return this;
      },
      add64(value: number | bigint) {
        input.add64(value);
        return this;
      },
      add128(value: number | bigint) {
        input.add128(value);
        return this;
      },
      add256(value: number | bigint) {
        input.add256(value);
        return this;
      },
      addBytes64(value: Uint8Array) {
        input.addBytes64(value);
        return this;
      },
      addBytes128(value: Uint8Array) {
        input.addBytes128(value);
        return this;
      },
      addBytes256(value: Uint8Array) {
        input.addBytes256(value);
        return this;
      },
      addAddress(value: string) {
        input.addAddress(value);
        return this;
      },
      getBits(): EncryptionTypes[] {
        return input.getBits();
      },
      encrypt: async () => {
        const bits = input.getBits();
        const ciphertext = input.encrypt();
        // https://github.com/zama-ai/fhevm-relayer/blob/978b08f62de060a9b50d2c6cc19fd71b5fb8d873/src/input_http_listener.rs#L13C1-L22C1
        const payload = {
          contractAddress: getAddress(contractAddress),
          userAddress: getAddress(userAddress),
          ciphertextWithZkpok: toHexString(ciphertext),
          contractChainId: '0x' + chainId.toString(16),
        };
        const options = {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        };
        const url = `${relayerUrl}/v1/input-proof`;
        let json: FhevmRelayerInputProofResponse;
        try {
          const response = await fetch(url, options);
          if (!response.ok) {
            throw new Error(
              `Relayer didn't response correctly. Bad status ${
                response.statusText
              }. Content: ${await response.text()}`,
            );
          }
          try {
            json = await response.json();
          } catch (e) {
            throw new Error("Relayer didn't response correctly. Bad JSON.", {
              cause: e,
            });
          }
        } catch (e) {
          throw new Error("Relayer didn't response correctly.", {
            cause: e,
          });
        }

        const handles = computeHandles(
          ciphertext,
          bits,
          aclContractAddress,
          chainId,
          currentCiphertextVersion(),
        );
        // Note that the hex strings returned by the relayer do have have the 0x prefix
        if (json.response.handles && json.response.handles.length > 0) {
          const responseHandles = json.response.handles.map(fromHexString);
          if (handles.length != responseHandles.length) {
            throw new Error(
              `Incorrect Handles list sizes: (expected) ${handles.length} != ${responseHandles.length} (received)`,
            );
          }
          for (let index = 0; index < handles.length; index += 1) {
            let handle = handles[index];
            let responseHandle = responseHandles[index];
            let expected = toHexString(handle);
            let current = toHexString(responseHandle);
            if (expected !== current) {
              throw new Error(
                `Incorrect Handle ${index}: (expected) ${expected} != ${current} (received)`,
              );
            }
          }
        }
        const signatures = json.response.signatures;

        // inputProof is len(list_handles) + numCoprocessorSigners + list_handles + signatureCoprocessorSigners (1+1+NUM_HANDLES*32+65*numSigners)
        let inputProof = numberToHex(handles.length);
        const numSigners = signatures.length;
        inputProof += numberToHex(numSigners);

        const listHandlesStr = handles.map((i) => toHexString(i));
        listHandlesStr.map((handle) => (inputProof += handle));
        signatures.map((signature) => (inputProof += signature.slice(2))); // removes the '0x' prefix from the `signature` string
        return {
          handles,
          inputProof: fromHexString(inputProof),
        };
      },
    };
  };

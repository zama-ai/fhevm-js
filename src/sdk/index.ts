import { isAddress } from 'ethers';
import {
  HTTPZInstanceConfig,
  getChainId,
  getKMSSigners,
  getProvider,
  getPublicParams,
  getTfheCompactPublicKey,
} from './config';
import {
  cleanURL,
  SERIALIZED_SIZE_LIMIT_CRS,
  SERIALIZED_SIZE_LIMIT_PK,
} from '../utils';
import { PublicParams, ZKInput } from './encrypt';
import { createEncryptedInput } from './encrypt';
import {
  generateKeypair,
  createEIP712,
  EIP712,
  createEIP712UserDecrypt,
} from './keypair';
import { CtHandleContractPair, userDecryptRequest } from './userDecrypt';
import { publicDecryptRequest } from './publicDecrypt';

export type HTTPZInstance = {
  createEncryptedInput: (
    contractAddress: string,
    userAddress: string,
  ) => ZKInput;
  generateKeypair: () => { publicKey: string; privateKey: string };
  createEIP712: (
    publicKey: string,
    contractAddress: string,
    delegatedAccount?: string,
  ) => EIP712;
  createEIP712UserDecrypt: (
    gatewayChainId: number,
    verifyingContract: string,
    publicKey: string,
    contractAddresses: string[],
    contractsChainId: string | number,
    startTimestamp: string,
    durationDays: string | number,
  ) => EIP712;
  publicDecrypt: (handle: bigint) => Promise<bigint>;
  userDecrypt: (
    verifyingContract: string,
    handle: CtHandleContractPair[],
    privateKey: string,
    publicKey: string,
    signature: string,
    contractAddresses: string[],
    userAddress: string,
    startTimestamp: bigint,
    durationDays: bigint,
  ) => Promise<bigint[]>;
  getPublicKey: () => { publicKeyId: string; publicKey: Uint8Array } | null;
  getPublicParams: (bits: keyof PublicParams) => {
    publicParams: Uint8Array;
    publicParamsId: string;
  } | null;
};

export {
  generateKeypair,
  createEIP712,
  createEIP712UserDecrypt,
} from './keypair';

export const createInstance = async (
  config: HTTPZInstanceConfig,
): Promise<HTTPZInstance> => {
  const { publicKey, kmsContractAddress, aclContractAddress } = config;

  if (!kmsContractAddress || !isAddress(kmsContractAddress)) {
    throw new Error('KMS contract address is not valid or empty');
  }

  if (!aclContractAddress || !isAddress(aclContractAddress)) {
    throw new Error('ACL contract address is not valid or empty');
  }

  if (publicKey && !(publicKey instanceof Uint8Array))
    throw new Error('publicKey must be a Uint8Array');

  const provider = getProvider(config);

  if (!provider) {
    throw new Error('No network has been provided!');
  }

  const chainId = await getChainId(provider, config);

  const publicKeyData = await getTfheCompactPublicKey(config);

  const publicParamsData = await getPublicParams(config);

  const kmsSigners = await getKMSSigners(provider, config);
  const userDecrypt = userDecryptRequest(
    kmsSigners,
    chainId,
    kmsContractAddress,
    aclContractAddress,
    cleanURL(config.relayerUrl),
    provider,
  );

  const publicDecrypt = publicDecryptRequest(
    kmsSigners,
    chainId,
    kmsContractAddress,
    aclContractAddress,
    cleanURL(config.relayerUrl),
    provider,
  );

  return {
    createEncryptedInput: createEncryptedInput(
      aclContractAddress,
      chainId,
      cleanURL(config.relayerUrl),
      publicKeyData.publicKey,
      publicParamsData,
    ),
    generateKeypair,
    createEIP712: createEIP712(chainId),
    createEIP712UserDecrypt: (
      gatewayChainId: number,
      verifyingContract: string,
      publicKey: string,
      contractAddresses: string[],
      contractsChainId: string | number,
      startTimestamp: string,
      durationDays: string | number,
    ) =>
      createEIP712UserDecrypt(
        gatewayChainId,
        verifyingContract,
        publicKey,
        contractAddresses,
        contractsChainId,
        startTimestamp,
        durationDays.toString(),
      ),
    publicDecrypt,
    userDecrypt,
    getPublicKey: () =>
      publicKeyData.publicKey
        ? {
            publicKey: publicKeyData.publicKey.safe_serialize(
              SERIALIZED_SIZE_LIMIT_PK,
            ),
            publicKeyId: publicKeyData.publicKeyId,
          }
        : null,
    getPublicParams: (bits: keyof PublicParams) => {
      if (publicParamsData[bits]) {
        return {
          publicParams: publicParamsData[bits]!.publicParams.safe_serialize(
            SERIALIZED_SIZE_LIMIT_CRS,
          ),
          publicParamsId: publicParamsData[bits]!.publicParamsId,
        };
      }
      return null;
    },
  };
};

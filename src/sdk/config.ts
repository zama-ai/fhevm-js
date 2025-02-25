import {
  BrowserProvider,
  Contract,
  Eip1193Provider,
  JsonRpcProvider,
  Provider,
} from 'ethers';
import { PublicParams } from './encrypt';
import { getKeysFromGateway } from './network';
import {
  fromHexString,
  cleanURL,
  SERIALIZED_SIZE_LIMIT_PK,
  SERIALIZED_SIZE_LIMIT_CRS,
} from '../utils';
import { CompactPkeCrs, TfheCompactPublicKey } from 'node-tfhe';
import { abi } from '../abi/kmsVerifier.json';

export type FhevmInstanceConfig = {
  kmsContractAddress: string;
  aclContractAddress: string;
  chainId?: number;
  publicKey?: Uint8Array | null;
  publicKeyId?: string | null;
  gatewayUrl?: string;
  network?: Eip1193Provider;
  networkUrl?: string;
  publicParams?: PublicParams<Uint8Array> | null;
};

export const getProvider = (config: FhevmInstanceConfig) => {
  if (config.networkUrl) {
    return new JsonRpcProvider(config.networkUrl);
  } else if (config.network) {
    return new BrowserProvider(config.network);
  }
  throw new Error(
    'You must provide a network URL or a EIP1193 object (eg: window.ethereum)',
  );
};

export const getChainId = async (
  provider: Provider,
  config: FhevmInstanceConfig,
): Promise<number> => {
  if (config.chainId && typeof config.chainId === 'number') {
    return config.chainId;
  } else if (config.chainId && typeof config.chainId !== 'number') {
    throw new Error('chainId must be a number.');
  } else {
    const chainId = (await provider.getNetwork()).chainId;
    return Number(chainId);
  }
};

export const getTfheCompactPublicKey = async (
  config: FhevmInstanceConfig,
): Promise<{ publicKey: TfheCompactPublicKey; publicKeyId: string }> => {
  if (config.gatewayUrl && !config.publicKey) {
    const inputs = await getKeysFromGateway(
      cleanURL(config.gatewayUrl),
      config.publicKeyId,
    );
    return { publicKey: inputs.publicKey, publicKeyId: inputs.publicKeyId };
  } else if (config.publicKey && config.publicKeyId) {
    const buff = config.publicKey;
    try {
      return {
        publicKey: TfheCompactPublicKey.safe_deserialize(
          buff,
          SERIALIZED_SIZE_LIMIT_PK,
        ),
        publicKeyId: config.publicKeyId,
      };
    } catch (e) {
      throw new Error('Invalid public key (deserialization failed)', {
        cause: e,
      });
    }
  } else {
    throw new Error('You must provide a public key with its public key ID.');
  }
};

export const getPublicParams = async (
  config: FhevmInstanceConfig,
): Promise<PublicParams> => {
  if (config.gatewayUrl && !config.publicParams) {
    const inputs = await getKeysFromGateway(
      cleanURL(config.gatewayUrl),
      config.publicKeyId,
    );
    return inputs.publicParams;
  } else if (config.publicParams && config.publicParams['2048']) {
    const buff = config.publicParams['2048'].publicParams;
    try {
      return {
        2048: {
          publicParams: CompactPkeCrs.safe_deserialize(
            buff,
            SERIALIZED_SIZE_LIMIT_CRS,
          ),
          publicParamsId: config.publicParams['2048'].publicParamsId,
        },
      };
    } catch (e) {
      throw new Error('Invalid public key (deserialization failed)', {
        cause: e,
      });
    }
  } else {
    throw new Error('You must provide a valid CRS with its CRS ID.');
  }
};

export const getKMSSigners = async (
  provider: Provider,
  config: FhevmInstanceConfig,
): Promise<string[]> => {
  const kmsContract = new Contract(config.kmsContractAddress, abi, provider);
  const signers: string[] = await kmsContract.getSigners();
  return signers;
};

// ESM explicit named re-export is required.
export {
  RelayerEncryptedInput,
  PublicParams,
  HandleContractPair,
  FhevmInstance,
  createInstance,
  createInstanceFromRelayer,
  EncryptionTypes,
  ENCRYPTION_TYPES,
  DecryptedResults,
  generateKeypair,
  createEIP712,
  EIP712,
  EIP712Type,
} from './index';

export {
  FhevmInstanceConfig,
  getFhevmInstanceConfigFromRelayer,
} from './config';
export { getContractsFromRelayer, getKeysFromRelayer } from './relayer/network';
export { initFhevm, TFHEInput, KMSInput } from './init';

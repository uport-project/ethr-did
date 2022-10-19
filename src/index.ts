import { createJWT, ES256KSigner, hexToBytes, JWTVerified, Signer as JWTSigner, verifyJWT } from 'did-jwt'
import { Signer as TxSigner } from '@ethersproject/abstract-signer'
import { CallOverrides } from '@ethersproject/contracts'
import { computeAddress } from '@ethersproject/transactions'
import { computePublicKey } from '@ethersproject/signing-key'
import { Provider } from '@ethersproject/providers'
import { Wallet } from '@ethersproject/wallet'
import * as base64 from '@ethersproject/base64'
import { hexlify, hexValue, isBytes } from '@ethersproject/bytes'
import { Base58 } from '@ethersproject/basex'
import { toUtf8Bytes } from '@ethersproject/strings'
import { EthrDidController, interpretIdentifier, MetaSignature, REGISTRY } from 'ethr-did-resolver'
import { Resolvable } from 'did-resolver'

export enum DelegateTypes {
  veriKey = 'veriKey',
  sigAuth = 'sigAuth',
  enc = 'enc',
}

interface IConfig {
  identifier: string
  chainNameOrId?: string | number

  registry?: string

  signer?: JWTSigner
  alg?: 'ES256K' | 'ES256K-R'
  txSigner?: TxSigner
  privateKey?: string

  rpcUrl?: string
  provider?: Provider
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  web3?: any
}

export type KeyPair = {
  address: string
  privateKey: string
  publicKey: string
  identifier: string
}

type DelegateOptions = {
  delegateType?: DelegateTypes
  expiresIn?: number
}

export class EthrDID {
  public did: string
  public address: string
  public signer?: JWTSigner
  public alg?: 'ES256K' | 'ES256K-R'
  private owner?: string
  private controller?: EthrDidController

  constructor(conf: IConfig) {
    const { address, publicKey, network } = interpretIdentifier(conf.identifier)
    const chainNameOrId = typeof conf.chainNameOrId === 'number' ? hexValue(conf.chainNameOrId) : conf.chainNameOrId
    if (conf.provider || conf.rpcUrl || conf.web3) {
      let txSigner = conf.txSigner
      if (conf.privateKey && typeof txSigner === 'undefined') {
        txSigner = new Wallet(conf.privateKey)
      }
      this.controller = new EthrDidController(
        conf.identifier,
        undefined,
        txSigner,
        chainNameOrId,
        conf.provider || conf.web3?.currentProvider,
        conf.rpcUrl,
        conf.registry || REGISTRY
      )
      this.did = this.controller.did
    } else {
      const net = network || chainNameOrId
      let networkString = net ? `${net}:` : ''
      if (networkString in ['mainnet:', '0x1:']) {
        networkString = ''
      }
      this.did =
        typeof publicKey === 'string' ? `did:ethr:${networkString}${publicKey}` : `did:ethr:${networkString}${address}`
    }
    this.address = address
    if (conf.signer) {
      this.signer = conf.signer
      this.alg = conf.alg
      if (!this.alg) {
        console.warn(
          'A JWT signer was specified but no algorithm was set. Please set the `alg` parameter when calling `new EthrDID()`'
        )
      }
    } else if (conf.privateKey) {
      this.signer = ES256KSigner(hexToBytes(conf.privateKey), true)
      this.alg = 'ES256K-R'
    }
  }

  static createKeyPair(chainNameOrId?: string | number): KeyPair {
    const wallet = Wallet.createRandom()
    const privateKey = wallet.privateKey
    const address = computeAddress(privateKey)
    const publicKey = computePublicKey(privateKey, true)
    const net = typeof chainNameOrId === 'number' ? hexValue(chainNameOrId) : chainNameOrId
    const identifier = net ? `did:ethr:${net}:${publicKey}` : publicKey
    return { address, privateKey, publicKey, identifier }
  }

  async lookupOwner(cache = true): Promise<string> {
    if (typeof this.controller === 'undefined') {
      throw new Error('a web3 provider configuration is needed for network operations')
    }
    if (cache && this.owner) return this.owner
    return this.controller?.getOwner(this.address)
  }

  async changeOwner(newOwner: string, txOptions?: CallOverrides): Promise<string> {
    if (typeof this.controller === 'undefined') {
      throw new Error('a web3 provider configuration is needed for network operations')
    }
    const owner = await this.lookupOwner()
    const receipt = await this.controller.changeOwner(newOwner, {
      ...txOptions,
      from: owner,
    })
    this.owner = newOwner
    return receipt.transactionHash
  }

  async createChangeOwnerHash(newOwner: string): Promise<string> {
    if (typeof this.controller === 'undefined') {
      throw new Error('a web3 provider configuration is needed for network operations')
    }
    return this.controller.createChangeOwnerHash(newOwner)
  }

  async changeOwnerSigned(newOwner: string, signature: MetaSignature, txOptions: CallOverrides = {}): Promise<string> {
    if (typeof this.controller === 'undefined') {
      throw new Error('a web3 provider configuration is needed for network operations')
    }
    const receipt = await this.controller.changeOwnerSigned(newOwner, signature, txOptions)
    this.owner = newOwner
    return receipt.transactionHash
  }

  async addDelegate(
    delegate: string,
    delegateOptions?: DelegateOptions,
    txOptions: CallOverrides = {}
  ): Promise<string> {
    if (typeof this.controller === 'undefined') {
      throw new Error('a web3 provider configuration is needed for network operations')
    }
    const owner = await this.lookupOwner()
    const receipt = await this.controller.addDelegate(
      delegateOptions?.delegateType || DelegateTypes.veriKey,
      delegate,
      delegateOptions?.expiresIn || 86400,
      { ...txOptions, from: owner }
    )
    return receipt.transactionHash
  }

  async createAddDelegateHash(delegateType: string, delegateAddress: string, exp: number): Promise<string> {
    if (typeof this.controller === 'undefined') {
      throw new Error('a web3 provider configuration is needed for network operations')
    }
    return this.controller.createAddDelegateHash(delegateType, delegateAddress, exp)
  }

  async addDelegateSigned(
    delegate: string,
    signature: MetaSignature,
    delegateOptions?: DelegateOptions,
    txOptions: CallOverrides = {}
  ): Promise<string> {
    if (typeof this.controller === 'undefined') {
      throw new Error('a web3 provider configuration is needed for network operations')
    }
    const receipt = await this.controller.addDelegateSigned(
      delegateOptions?.delegateType || DelegateTypes.veriKey,
      delegate,
      delegateOptions?.expiresIn || 86400,
      signature,
      txOptions
    )
    return receipt.transactionHash
  }

  async revokeDelegate(
    delegate: string,
    delegateType = DelegateTypes.veriKey,
    txOptions: CallOverrides = {}
  ): Promise<string> {
    if (typeof this.controller === 'undefined') {
      throw new Error('a web3 provider configuration is needed for network operations')
    }
    const owner = await this.lookupOwner()
    const receipt = await this.controller.revokeDelegate(delegateType, delegate, { ...txOptions, from: owner })
    return receipt.transactionHash
  }

  async createRevokeDelegateHash(delegateType: string, delegateAddress: string): Promise<string> {
    if (typeof this.controller === 'undefined') {
      throw new Error('a web3 provider configuration is needed for network operations')
    }
    return this.controller.createRevokeDelegateHash(delegateType, delegateAddress)
  }

  async revokeDelegateSigned(
    delegate: string,
    delegateType = DelegateTypes.veriKey,
    signature: MetaSignature,
    txOptions: CallOverrides = {}
  ): Promise<string> {
    if (typeof this.controller === 'undefined') {
      throw new Error('a web3 provider configuration is needed for network operations')
    }
    const receipt = await this.controller.revokeDelegateSigned(delegateType, delegate, signature, txOptions)
    return receipt.transactionHash
  }

  async setAttribute(
    key: string,
    value: string | Uint8Array,
    expiresIn = 86400,
    /** @deprecated please use `txOptions.gasLimit` */
    gasLimit?: number,
    txOptions: CallOverrides = {}
  ): Promise<string> {
    if (typeof this.controller === 'undefined') {
      throw new Error('a web3 provider configuration is needed for network operations')
    }
    const owner = await this.lookupOwner()
    const receipt = await this.controller.setAttribute(key, attributeToHex(key, value), expiresIn, {
      gasLimit,
      ...txOptions,
      from: owner,
    })
    return receipt.transactionHash
  }

  async createSetAttributeHash(attrName: string, attrValue: string, exp: number) {
    if (typeof this.controller === 'undefined') {
      throw new Error('a web3 provider configuration is needed for network operations')
    }
    return this.controller.createSetAttributeHash(attrName, attrValue, exp)
  }

  async setAttributeSigned(
    key: string,
    value: string | Uint8Array,
    expiresIn = 86400,
    signature: MetaSignature,
    txOptions: CallOverrides = {}
  ): Promise<string> {
    if (typeof this.controller === 'undefined') {
      throw new Error('a web3 provider configuration is needed for network operations')
    }
    const receipt = await this.controller.setAttributeSigned(
      key,
      attributeToHex(key, value),
      expiresIn,
      signature,
      txOptions
    )
    return receipt.transactionHash
  }

  async revokeAttribute(
    key: string,
    value: string | Uint8Array,
    /** @deprecated please use `txOptions.gasLimit` */
    gasLimit?: number,
    txOptions: CallOverrides = {}
  ): Promise<string> {
    if (typeof this.controller === 'undefined') {
      throw new Error('a web3 provider configuration is needed for network operations')
    }
    const owner = await this.lookupOwner()
    const receipt = await this.controller.revokeAttribute(key, attributeToHex(key, value), {
      gasLimit,
      ...txOptions,
      from: owner,
    })
    return receipt.transactionHash
  }

  async createRevokeAttributeHash(attrName: string, attrValue: string) {
    if (typeof this.controller === 'undefined') {
      throw new Error('a web3 provider configuration is needed for network operations')
    }
    return this.controller.createRevokeAttributeHash(attrName, attrValue)
  }

  async revokeAttributeSigned(
    key: string,
    value: string | Uint8Array,
    signature: MetaSignature,
    txOptions: CallOverrides = {}
  ): Promise<string> {
    if (typeof this.controller === 'undefined') {
      throw new Error('a web3 provider configuration is needed for network operations')
    }
    const receipt = await this.controller.revokeAttributeSigned(key, attributeToHex(key, value), signature, txOptions)
    return receipt.transactionHash
  }

  // Create a temporary signing delegate able to sign JWT on behalf of identity
  async createSigningDelegate(
    delegateType = DelegateTypes.veriKey,
    expiresIn = 86400
  ): Promise<{ kp: KeyPair; txHash: string }> {
    const kp = EthrDID.createKeyPair()
    this.signer = ES256KSigner(hexToBytes(kp.privateKey), true)
    const txHash = await this.addDelegate(kp.address, {
      delegateType,
      expiresIn,
    })
    return { kp, txHash }
  }

  // eslint-disable-next-line
  async signJWT(payload: any, expiresIn?: number): Promise<string> {
    if (typeof this.signer !== 'function') {
      throw new Error('No signer configured')
    }
    const options = {
      signer: this.signer,
      alg: 'ES256K-R',
      issuer: this.did,
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if (expiresIn) (<any>options)['expiresIn'] = expiresIn
    return createJWT(payload, options)
  }

  async verifyJWT(jwt: string, resolver: Resolvable, audience = this.did): Promise<JWTVerified> {
    return verifyJWT(jwt, { resolver, audience })
  }
}

function attributeToHex(key: string, value: string | Uint8Array): string {
  if (value instanceof Uint8Array || isBytes(value)) {
    return hexlify(value)
  }
  const matchKeyWithEncoding = key.match(/^did\/(pub|auth|svc)\/(\w+)(\/(\w+))?(\/(\w+))?$/)
  const encoding = matchKeyWithEncoding?.[6]
  const matchHexString = (<string>value).match(/^0x[0-9a-fA-F]*$/)
  if (encoding && !matchHexString) {
    if (encoding === 'base64') {
      return hexlify(base64.decode(value))
    }
    if (encoding === 'base58') {
      return hexlify(Base58.decode(value))
    }
  } else if (matchHexString) {
    return <string>value
  }

  return hexlify(toUtf8Bytes(value))
}

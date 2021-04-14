import { createJWT, verifyJWT, Signer as JWTSigner, ES256KSigner } from 'did-jwt'
import { Signer as TxSigner } from '@ethersproject/abstract-signer'
import { CallOverrides } from '@ethersproject/contracts'
import { computeAddress } from '@ethersproject/transactions'
import { getAddress } from '@ethersproject/address'
import { Wallet } from '@ethersproject/wallet'
import { REGISTRY, EthrDidController } from 'ethr-did-resolver'
import { Resolvable } from 'did-resolver'
import { ec as EC } from 'elliptic'
const secp256k1: any = new EC('secp256k1')

export enum DelegateTypes {
  veriKey = 'veriKey',
  sigAuth = 'sigAuth',
  enc = 'enc',
}

interface IConfig {
  identifier: string
  chainNameOrId?: string

  registry?: string

  signer?: JWTSigner
  txSigner?: TxSigner
  privateKey?: string

  rpcUrl?: string
  provider?: any
  web3?: any
}

export type KeyPair = {
  address: string
  privateKey: string
  publicKey: string
}

export class EthrDID {
  public did: string
  public address: string
  public signer?: JWTSigner
  private owner?: string
  private controller?: EthrDidController

  constructor(conf: IConfig) {
    const { address, publicKey, network } = interpretIdentifier(conf.identifier)

    if (conf.provider || conf.rpcUrl || conf.web3) {
      let txSigner = conf.txSigner
      if (conf.privateKey && typeof txSigner === 'undefined') {
        txSigner = new Wallet(conf.privateKey)
      }

      this.controller = new EthrDidController(
        conf.identifier,
        undefined,
        txSigner,
        conf.chainNameOrId,
        conf.provider || conf.web3?.currentProvider,
        conf.rpcUrl,
        conf.registry || REGISTRY
      )
      this.did = this.controller.did
    } else {
      const net = network || conf.chainNameOrId
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
    } else if (conf.privateKey) {
      this.signer = ES256KSigner(conf.privateKey, true)
    }
  }

  static createKeyPair(): KeyPair {
    const kp = secp256k1.genKeyPair()
    const privateKey = kp.getPrivate('hex')
    const publicKey = '0x' + kp.getPublic(true, 'hex')
    const address = computeAddress(publicKey)
    return { address, privateKey, publicKey }
  }

  async lookupOwner(cache = true): Promise<string> {
    if (typeof this.controller === 'undefined') {
      throw new Error('a web3 provider configuration is needed for network operations')
    }
    if (cache && this.owner) return this.owner
    const result = await this.controller?.getOwner(this.address)
    return result
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

  async addDelegate(
    delegate: string,
    { delegateType = DelegateTypes.veriKey, expiresIn = 86400 },
    txOptions: CallOverrides = {}
  ): Promise<string> {
    if (typeof this.controller === 'undefined') {
      throw new Error('a web3 provider configuration is needed for network operations')
    }
    const owner = await this.lookupOwner()
    const receipt = await this.controller.addDelegate(delegateType, delegate, expiresIn, { ...txOptions, from: owner })
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

  async setAttribute(
    key: string,
    value: string | Uint8Array,
    expiresIn = 86400,
    /** @deprecated, please use txOptions.gasLimit */
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

  // Create a temporary signing delegate able to sign JWT on behalf of identity
  async createSigningDelegate(
    delegateType = DelegateTypes.veriKey,
    expiresIn = 86400
  ): Promise<{
    kp: KeyPair
    txHash: string
  }> {
    const kp = EthrDID.createKeyPair()
    this.signer = ES256KSigner(kp.privateKey, true)
    const txHash = await this.addDelegate(kp.address, {
      delegateType,
      expiresIn,
    })
    return { kp, txHash }
  }

  async signJWT(payload: any, expiresIn?: number): Promise<string> {
    if (typeof this.signer !== 'function') {
      throw new Error('No signer configured')
    }
    const options = {
      signer: this.signer,
      alg: 'ES256K-R',
      issuer: this.did,
    }
    if (expiresIn) (<any>options)['expiresIn'] = expiresIn
    return createJWT(payload, options)
  }

  async verifyJWT(jwt: string, resolver: Resolvable, audience = this.did): Promise<any> {
    return verifyJWT(jwt, { resolver, audience })
  }
}

function interpretIdentifier(identifier: string): { address: string; publicKey?: string; network?: string } {
  let input = identifier
  let network = undefined
  if (input.startsWith('did:ethr')) {
    const components = input.split(':')
    input = components[components.length - 1]
    if (components.length === 4) {
      network = components[2]
    }
  }
  if (input.length > 42) {
    return { address: computeAddress(input), publicKey: input, network }
  } else {
    return { address: getAddress(input), network } // checksum address
  }
}

function attributeToHex(key: string, value: string | Uint8Array): string {
  if (Buffer.isBuffer(value)) {
    return `0x${value.toString('hex')}`
  }
  const match = key.match(/^did\/(pub|auth|svc)\/(\w+)(\/(\w+))?(\/(\w+))?$/)
  if (match) {
    const encoding = match[6]
    // TODO add support for base58
    if (encoding === 'base64') {
      return `0x${Buffer.from(<string>value, 'base64').toString('hex')}`
    }
  }
  if ((<string>value).match(/^0x[0-9a-fA-F]*$/)) {
    return <string>value
  }
  return `0x${Buffer.from(value).toString('hex')}`
}

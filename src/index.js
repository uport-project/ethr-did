import HttpProvider from 'ethjs-provider-http'
import Eth from 'ethjs-query'
import abi from 'ethjs-abi'
import EthContract from 'ethjs-contract'
import DidRegistryContract from 'ethr-did-resolver/contracts/ethr-did-registry.json'
import { createJWT, verifyJWT, SimpleSigner } from 'did-jwt'
import { ec as EC } from 'elliptic'
import { toEthereumAddress } from 'did-jwt/lib/Digest'
import { Buffer } from 'buffer'
const secp256k1 = new EC('secp256k1')

export const REGISTRY = '0xc1b66dea11f8f321b7981e1666fdaf3637fe0f61'

function configureProvider (conf = {}) {
  if (conf.provider) {
    return conf.provider
  } else if (conf.web3) {
    return conf.web3.currentProvider
  } else {
    return new HttpProvider(conf.rpcUrl || 'https://mainnet.infura.io/ethr-did')
  }
}

function attributeToHex (key, value) {
  if (Buffer.isBuffer(value)) {
    return `0x${value.toString('hex')}`
  }
  const match = key.match(/^did\/(publicKey|authentication)\/\w+\/\w+(Base64)$/)
  if (match) {
    const encoding = match[2]
    // TODO add support for base58
    if (encoding === 'Base64') {
      return `0x${Buffer.from(value, 'base64').toString('hex')}`
    }
  }
  if (value.match(/^0x[0-9a-fA-F]*$/)) {
    return value
  }
  return `0x${Buffer.from(value).toString('hex')}`
}

export function createKeyPair () {
  const kp = secp256k1.genKeyPair()
  const publicKey = kp.getPublic('hex')
  const privateKey = kp.getPrivate('hex')
  const address = toEthereumAddress(publicKey)
  return {address, privateKey}
}

class EthrDID {
  constructor (conf = {}) {
    const provider = configureProvider(conf)
    const eth = new Eth(provider)
    const registryAddress = conf.registry || REGISTRY
    const DidReg = new EthContract(eth)(DidRegistryContract)
    this.registry = DidReg.at(registryAddress)
    this.address = conf.address
    if (!this.address) throw new Error('No address is set for EthrDid')
    this.did = `did:ethr:${this.address}`
    if (conf.signer) {
      this.signer = conf.signer
    } else if (conf.privateKey) {
      this.signer = SimpleSigner(conf.privateKey)
    }
  }

  async lookupOwner (cache = true) {
    if (cache && this.owner) return this.owner
    const result = await this.registry.identityOwner(this.address)
    return result['0']
  }

  async changeOwner (newOwner) {
    const owner = await this.lookupOwner()
    const txHash = await this.registry.changeOwner(this.address, newOwner, {from: owner})
    this.owner = newOwner
    return txHash
  }

  async addDelegate (delegate, options = {}) {
    const delegateType = options.delegateType || 'Secp256k1VerificationKey2018'
    const expiresIn = options.expiresIn || 86400
    const owner = await this.lookupOwner()
    return this.registry.addDelegate(this.address, delegateType, delegate, expiresIn, {from: owner})
  }

  async revokeDelegate (delegate, delegateType = 'Secp256k1VerificationKey2018') {
    const owner = await this.lookupOwner()
    return this.registry.revokeDelegate(this.address, delegateType, delegate, {from: owner})
  }

  async setAttribute (key, value, expiresIn = 86400) {
    const owner = await this.lookupOwner()
    return this.registry.setAttribute(this.address, key, attributeToHex(key, value), expiresIn, {from: owner})
  }

  // Create a temporary signing delegate able to sign JWT on behalf of identity
  async createSigningDelegate (delegateType = 'Secp256k1VerificationKey2018', expiresIn = 86400) {
    const kp = createKeyPair()
    this.signer = SimpleSigner(kp.privateKey)
    const txHash = await this.addDelegate(kp.address, {delegateType, expiresIn})
    return {kp, txHash}
  }

  async signJWT (payload, expiresIn) {
    if (typeof this.signer !== 'function') throw new Error('No signer configured')
    const options = {signer: this.signer, alg: 'ES256K-R', issuer: this.did}
    if (expiresIn) options.expiresIn = expiresIn
    return createJWT(payload, options)
  }

  async verifyJWT (jwt, audience=this.did) {
    return verifyJWT(jwt, {audience})
  }
}
EthrDID.createKeyPair = createKeyPair
module.exports = EthrDID

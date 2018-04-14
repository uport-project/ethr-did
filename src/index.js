import Contract from 'truffle-contract'
import DidRegistryContract from 'ethr-did-registry'
import Web3 from 'web3'

export const REGISTRY = '0xc1b66dea11f8f321b7981e1666fdaf3637fe0f61'

function configureProvider (conf = {}) {
  if (conf.provider) {
    return conf.provider
  } else if (conf.web3) {
    return conf.web3.currentProvider
  }
  throw new Error('either web3 object or provider is required')
}
const DidReg = Contract(DidRegistryContract)

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
  return value
}

class EthrDID {
  constructor (conf = {}) {
    const provider = configureProvider(conf)
    this.web3 = new Web3()
    this.web3.setProvider(provider)
    DidReg.setProvider(provider)
    this.registry = DidReg.at(conf.registry || REGISTRY)
    this.address = conf.address || this.web3.eth.defaultAccount
    if (!this.address) throw new Error('No address is set for EthrDid')
    this.did = `did:ethr:${this.address}`
  }

  async lookupOwner () {
    return this.registry.identityOwner(this.address)
  }

  async changeOwner (newOwner) {
    const owner = await this.lookupOwner()
    return this.registry.changeOwner(this.address, newOwner, {from: owner})
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
}
module.exports = EthrDID

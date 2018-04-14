import resolve from 'did-resolver'
import register from 'ethr-did-resolver'
import EthrDid from '../index.js'
import Contract from 'truffle-contract'
import DidRegistryContract from 'ethr-did-registry'
import Web3 from 'web3'
import ganache from 'ganache-cli'

function sleep (seconds) {
  return new Promise((resolve, reject) => setTimeout(resolve, seconds * 1000))
}
describe('ethrResolver', () => {
  const provider = ganache.provider()
  const DidReg = Contract(DidRegistryContract)
  const web3 = new Web3()
  web3.setProvider(provider)
  const getAccounts = () => new Promise((resolve, reject) => web3.eth.getAccounts((error, accounts) => error ? reject(error) : resolve(accounts)))
  DidReg.setProvider(provider)

  let ethrDid, registry, accounts, did, identity, owner, delegate1, delegate2

  beforeAll(async () => {
    accounts = await getAccounts()
    identity = accounts[1]
    owner = accounts[2]
    delegate1 = accounts[3]
    delegate2 = accounts[4]
    did = `did:ethr:${identity}`

    registry = await DidReg.new({
      from: accounts[0],
      gasPrice: 100000000000,
      gas: 4712388
    })
    ethrDid = new EthrDid({provider, registry: registry.address, address: identity})
    register({provider, registry: registry.address})
  })

  describe('presets', () => {
    it('sets address', () => {
      expect(ethrDid.address).toEqual(identity)
    })

    it('sets did', () => {
      expect(ethrDid.did).toEqual(did)
    })
  })

  it('defaults to itself', () => {
    return expect(ethrDid.lookupOwner()).resolves.toEqual(identity)
  })

  describe('owner changed', () => {
    beforeAll(async () => {
      await ethrDid.changeOwner(owner)
    })

    it('changes owner', () => {
      return expect(ethrDid.lookupOwner()).resolves.toEqual(owner)
    })

    it('resolves document', () => {
      return expect(resolve(did)).resolves.toEqual({
        '@context': 'https://w3id.org/did/v1',
        id: did,
        publicKey: [{
          id: `${did}#owner`,
          type: 'Secp256k1VerificationKey2018',
          owner: did,
          ethereumAddress: owner
        }],
        authentication: [{
          type: 'Secp256k1SignatureAuthentication2018',
          publicKey: `${did}#owner`
        }]
      })
    })
  })

  describe('delegates', () => {
    describe('add signing delegate', () => {
      beforeAll(async () => {
        await ethrDid.addDelegate(delegate1, {expiresIn: 2})
      })

      it('resolves document', () => {
        return expect(resolve(did)).resolves.toEqual({
          '@context': 'https://w3id.org/did/v1',
          id: did,
          publicKey: [{
            id: `${did}#owner`,
            type: 'Secp256k1VerificationKey2018',
            owner: did,
            ethereumAddress: owner
          }, {
            id: `${did}#delegate-1`,
            type: 'Secp256k1VerificationKey2018',
            owner: did,
            ethereumAddress: delegate1
          }],
          authentication: [{
            type: 'Secp256k1SignatureAuthentication2018',
            publicKey: `${did}#owner`
          }]
        })
      })
    })

    describe('add auth delegate', () => {
      beforeAll(async () => {
        await ethrDid.addDelegate(delegate2, {delegateType: 'Secp256k1SignatureAuthentication2018', expiresIn: 10})
      })

      it('resolves document', () => {
        return expect(resolve(did)).resolves.toEqual({
          '@context': 'https://w3id.org/did/v1',
          id: did,
          publicKey: [{
            id: `${did}#owner`,
            type: 'Secp256k1VerificationKey2018',
            owner: did,
            ethereumAddress: owner
          }, {
            id: `${did}#delegate-1`,
            type: 'Secp256k1VerificationKey2018',
            owner: did,
            ethereumAddress: delegate1
          }, {
            id: `${did}#delegate-2`,
            type: 'Secp256k1VerificationKey2018',
            owner: did,
            ethereumAddress: delegate2
          }],
          authentication: [{
            type: 'Secp256k1SignatureAuthentication2018',
            publicKey: `${did}#owner`
          }, {
            type: 'Secp256k1SignatureAuthentication2018',
            publicKey: `${did}#delegate-2`
          }]
        })
      })
    })

    describe('expire automatically', () => {
      beforeAll(async () => {
        await sleep(3)
      })

      it('resolves document', () => {
        return expect(resolve(did)).resolves.toEqual({
          '@context': 'https://w3id.org/did/v1',
          id: did,
          publicKey: [{
            id: `${did}#owner`,
            type: 'Secp256k1VerificationKey2018',
            owner: did,
            ethereumAddress: owner
          }, {
            id: `${did}#delegate-1`,
            type: 'Secp256k1VerificationKey2018',
            owner: did,
            ethereumAddress: delegate2
          }],
          authentication: [{
            type: 'Secp256k1SignatureAuthentication2018',
            publicKey: `${did}#owner`
          }, {
            type: 'Secp256k1SignatureAuthentication2018',
            publicKey: `${did}#delegate-1`
          }]
        })
      })
    })

    describe('revokes delegate', () => {
      beforeAll(async () => {
        await ethrDid.revokeDelegate(delegate2, 'Secp256k1SignatureAuthentication2018')
      })

      it('resolves document', () => {
        return expect(resolve(did)).resolves.toEqual({
          '@context': 'https://w3id.org/did/v1',
          id: did,
          publicKey: [{
            id: `${did}#owner`,
            type: 'Secp256k1VerificationKey2018',
            owner: did,
            ethereumAddress: owner
          }],
          authentication: [{
            type: 'Secp256k1SignatureAuthentication2018',
            publicKey: `${did}#owner`
          }]
        })
      })
    })

    describe('re-add auth delegate', () => {
      beforeAll(async () => {
        await ethrDid.addDelegate(delegate2, {delegateType: 'Secp256k1SignatureAuthentication2018', expiresIn: 86400})
      })

      it('resolves document', () => {
        return expect(resolve(did)).resolves.toEqual({
          '@context': 'https://w3id.org/did/v1',
          id: did,
          publicKey: [{
            id: `${did}#owner`,
            type: 'Secp256k1VerificationKey2018',
            owner: did,
            ethereumAddress: owner
          }, {
            id: `${did}#delegate-1`,
            type: 'Secp256k1VerificationKey2018',
            owner: did,
            ethereumAddress: delegate2
          }],
          authentication: [{
            type: 'Secp256k1SignatureAuthentication2018',
            publicKey: `${did}#owner`
          }, {
            type: 'Secp256k1SignatureAuthentication2018',
            publicKey: `${did}#delegate-1`
          }]
        })
      })
    })
  })

  describe('attributes', () => {
    describe('publicKey', () => {
      describe('Secp256k1VerificationKey2018', () => {
        beforeAll(async () => {
          await ethrDid.setAttribute('did/publicKey/Secp256k1VerificationKey2018', '0x02b97c30de767f084ce3080168ee293053ba33b235d7116a3263d29f1450936b71', 10)
        })
  
        it('resolves document', () => {
          return expect(resolve(did)).resolves.toEqual({
            '@context': 'https://w3id.org/did/v1',
            id: did,
            publicKey: [{
              id: `${did}#owner`,
              type: 'Secp256k1VerificationKey2018',
              owner: did,
              ethereumAddress: owner
            }, {
              id: `${did}#delegate-1`,
              type: 'Secp256k1VerificationKey2018',
              owner: did,
              ethereumAddress: delegate2
            }, {
              id: `${did}#delegate-2`,
              type: 'Secp256k1VerificationKey2018',
              owner: did,
              publicKeyHex: '02b97c30de767f084ce3080168ee293053ba33b235d7116a3263d29f1450936b71'
            }],
            authentication: [{
              type: 'Secp256k1SignatureAuthentication2018',
              publicKey: `${did}#owner`
            }, {
              type: 'Secp256k1SignatureAuthentication2018',
              publicKey: `${did}#delegate-1`
            }]
          })
        })
      })

      describe('Ed25519VerificationKey2018', () => {
        beforeAll(async () => {
          await ethrDid.setAttribute('did/publicKey/Ed25519VerificationKey2018/publicKeyBase64', '0x02b97c30de767f084ce3080168ee293053ba33b235d7116a3263d29f1450936b71', 10)
        })
  
        it('resolves document', () => {
          return expect(resolve(did)).resolves.toEqual({
            '@context': 'https://w3id.org/did/v1',
            id: did,
            publicKey: [{
              id: `${did}#owner`,
              type: 'Secp256k1VerificationKey2018',
              owner: did,
              ethereumAddress: owner
            }, {
              id: `${did}#delegate-1`,
              type: 'Secp256k1VerificationKey2018',
              owner: did,
              ethereumAddress: delegate2
            }, {
              id: `${did}#delegate-2`,
              type: 'Secp256k1VerificationKey2018',
              owner: did,
              publicKeyHex: '02b97c30de767f084ce3080168ee293053ba33b235d7116a3263d29f1450936b71'
            }, {
              id: `${did}#delegate-3`,
              type: 'Ed25519VerificationKey2018',
              owner: did,
              publicKeyBase64: Buffer.from('02b97c30de767f084ce3080168ee293053ba33b235d7116a3263d29f1450936b71', 'hex').toString('base64')
            }],
            authentication: [{
              type: 'Secp256k1SignatureAuthentication2018',
              publicKey: `${did}#owner`
            }, {
              type: 'Secp256k1SignatureAuthentication2018',
              publicKey: `${did}#delegate-1`
            }]
          })
        })
      })
    })

    describe('service endpoints', () => {
      describe('HubService', () => {
        beforeAll(async () => {
          await ethrDid.setAttribute('did/service/HubService', 'https://hubs.uport.me', 10)
        })
        it('resolves document', () => {
          return expect(resolve(did)).resolves.toEqual({
            '@context': 'https://w3id.org/did/v1',
            id: did,
            publicKey: [{
              id: `${did}#owner`,
              type: 'Secp256k1VerificationKey2018',
              owner: did,
              ethereumAddress: owner
            }, {
              id: `${did}#delegate-1`,
              type: 'Secp256k1VerificationKey2018',
              owner: did,
              ethereumAddress: delegate2
            }, {
              id: `${did}#delegate-2`,
              type: 'Secp256k1VerificationKey2018',
              owner: did,
              publicKeyHex: '02b97c30de767f084ce3080168ee293053ba33b235d7116a3263d29f1450936b71'
            }, {
              id: `${did}#delegate-3`,
              type: 'Ed25519VerificationKey2018',
              owner: did,
              publicKeyBase64: Buffer.from('02b97c30de767f084ce3080168ee293053ba33b235d7116a3263d29f1450936b71', 'hex').toString('base64')
            }],
            authentication: [{
              type: 'Secp256k1SignatureAuthentication2018',
              publicKey: `${did}#owner`
            }, {
              type: 'Secp256k1SignatureAuthentication2018',
              publicKey: `${did}#delegate-1`
            }],
            service: [{
              type: 'HubService',
              serviceEndpoint: 'https://hubs.uport.me'
            }]
          })
        })
      })
    })
  })

})

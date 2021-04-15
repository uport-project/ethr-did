import { Resolver, Resolvable } from 'did-resolver'
import { Contract, ContractFactory } from '@ethersproject/contracts'
import { JsonRpcProvider } from '@ethersproject/providers'
import { getResolver } from 'ethr-did-resolver'
import { EthrDID, DelegateTypes, KeyPair } from '../index'
import { createProvider, sleep } from './testUtils'
import DidRegistryContract from 'ethr-did-registry'
import { verifyJWT } from 'did-jwt'

describe('EthrDID', () => {
  let ethrDid: EthrDID,
    plainDid: EthrDID,
    registry: string,
    accounts: string[],
    did: string,
    identity: string,
    owner: string,
    delegate1: string,
    delegate2: string,
    resolver: Resolvable

  const provider: JsonRpcProvider = createProvider()

  beforeAll(async () => {
    const factory = ContractFactory.fromSolidity(DidRegistryContract).connect(provider.getSigner(0))

    let registryContract: Contract
    registryContract = await factory.deploy()
    registryContract = await registryContract.deployed()

    await registryContract.deployTransaction.wait()

    registry = registryContract.address

    accounts = await provider.listAccounts()

    identity = accounts[1]
    owner = accounts[2]
    delegate1 = accounts[3]
    delegate2 = accounts[4]
    did = `did:ethr:dev:${identity}`

    resolver = new Resolver(getResolver({ name: 'dev', provider, registry, chainId: 1337 }))
    ethrDid = new EthrDID({
      provider,
      registry,
      identifier: identity,
      chainNameOrId: 'dev',
    })
  })

  describe('presets', () => {
    it('sets address', () => {
      expect(ethrDid.address).toEqual(identity)
    })

    it('sets did', () => {
      expect(ethrDid.did).toEqual(did)
    })
  })

  it('defaults owner to itself', () => {
    return expect(ethrDid.lookupOwner()).resolves.toEqual(identity)
  })

  describe('key management', () => {
    describe('owner changed', () => {
      beforeAll(async () => {
        await ethrDid.changeOwner(owner)
      })

      it('changes owner', () => {
        return expect(ethrDid.lookupOwner()).resolves.toEqual(owner)
      })

      it('resolves document', async () => {
        return expect((await resolver.resolve(did)).didDocument).toEqual({
          '@context': [
            'https://www.w3.org/ns/did/v1',
            'https://identity.foundation/EcdsaSecp256k1RecoverySignature2020/lds-ecdsa-secp256k1-recovery2020-0.0.jsonld',
          ],
          id: did,
          verificationMethod: [
            {
              id: `${did}#controller`,
              type: 'EcdsaSecp256k1RecoveryMethod2020',
              controller: did,
              blockchainAccountId: `${owner}@eip155:1337`,
            },
          ],
          authentication: [`${did}#controller`],
        })
      })
    })

    describe('delegates', () => {
      describe('add signing delegate', () => {
        beforeAll(async () => {
          const txHash = await ethrDid.addDelegate(delegate1, {
            expiresIn: 100,
          })
          await provider.waitForTransaction(txHash)
        })

        it('resolves document', async () => {
          const resolution = await resolver.resolve(did)
          return expect(resolution.didDocument).toEqual({
            '@context': [
              'https://www.w3.org/ns/did/v1',
              'https://identity.foundation/EcdsaSecp256k1RecoverySignature2020/lds-ecdsa-secp256k1-recovery2020-0.0.jsonld',
            ],
            id: did,
            verificationMethod: [
              {
                id: `${did}#controller`,
                type: 'EcdsaSecp256k1RecoveryMethod2020',
                controller: did,
                blockchainAccountId: `${owner}@eip155:1337`,
              },
              {
                id: `${did}#delegate-1`,
                type: 'EcdsaSecp256k1RecoveryMethod2020',
                controller: did,
                blockchainAccountId: `${delegate1}@eip155:1337`,
              },
            ],
            authentication: [`${did}#controller`],
          })
        })
      })

      describe('add auth delegate', () => {
        beforeAll(async () => {
          await ethrDid.addDelegate(delegate2, {
            delegateType: DelegateTypes.sigAuth,
            expiresIn: 2,
          })
        })

        it('resolves document', async () => {
          return expect((await resolver.resolve(did)).didDocument).toEqual({
            '@context': [
              'https://www.w3.org/ns/did/v1',
              'https://identity.foundation/EcdsaSecp256k1RecoverySignature2020/lds-ecdsa-secp256k1-recovery2020-0.0.jsonld',
            ],
            id: did,
            verificationMethod: [
              {
                id: `${did}#controller`,
                type: 'EcdsaSecp256k1RecoveryMethod2020',
                controller: did,
                blockchainAccountId: `${owner}@eip155:1337`,
              },
              {
                id: `${did}#delegate-1`,
                type: 'EcdsaSecp256k1RecoveryMethod2020',
                controller: did,
                blockchainAccountId: `${delegate1}@eip155:1337`,
              },
              {
                id: `${did}#delegate-2`,
                type: 'EcdsaSecp256k1RecoveryMethod2020',
                controller: did,
                blockchainAccountId: `${delegate2}@eip155:1337`,
              },
            ],
            authentication: [`${did}#controller`, `${did}#delegate-2`],
          })
        })
      })

      describe('expire automatically', () => {
        beforeAll(async () => {
          await sleep(4)
        })

        it('resolves document', async () => {
          const resolution = await resolver.resolve(did)
          return expect(resolution.didDocument).toEqual({
            '@context': [
              'https://www.w3.org/ns/did/v1',
              'https://identity.foundation/EcdsaSecp256k1RecoverySignature2020/lds-ecdsa-secp256k1-recovery2020-0.0.jsonld',
            ],
            id: did,
            verificationMethod: [
              {
                id: `${did}#controller`,
                type: 'EcdsaSecp256k1RecoveryMethod2020',
                controller: did,
                blockchainAccountId: `${owner}@eip155:1337`,
              },
              {
                id: `${did}#delegate-1`,
                type: 'EcdsaSecp256k1RecoveryMethod2020',
                controller: did,
                blockchainAccountId: `${delegate1}@eip155:1337`,
              },
            ],
            authentication: [`${did}#controller`],
          })
        })
      })

      describe('re-add auth delegate', () => {
        beforeAll(async () => {
          await ethrDid.addDelegate(delegate2, {
            delegateType: DelegateTypes.sigAuth,
          })
        })

        it('resolves document', async () => {
          return expect((await resolver.resolve(did)).didDocument).toEqual({
            '@context': [
              'https://www.w3.org/ns/did/v1',
              'https://identity.foundation/EcdsaSecp256k1RecoverySignature2020/lds-ecdsa-secp256k1-recovery2020-0.0.jsonld',
            ],
            id: did,
            verificationMethod: [
              {
                id: `${did}#controller`,
                type: 'EcdsaSecp256k1RecoveryMethod2020',
                controller: did,
                blockchainAccountId: `${owner}@eip155:1337`,
              },
              {
                id: `${did}#delegate-1`,
                type: 'EcdsaSecp256k1RecoveryMethod2020',
                controller: did,
                blockchainAccountId: `${delegate1}@eip155:1337`,
              },
              {
                id: `${did}#delegate-3`,
                type: 'EcdsaSecp256k1RecoveryMethod2020',
                controller: did,
                blockchainAccountId: `${delegate2}@eip155:1337`,
              },
            ],
            authentication: [`${did}#controller`, `${did}#delegate-3`],
          })
        })
      })

      describe('revokes delegate', () => {
        beforeAll(async () => {
          await ethrDid.revokeDelegate(delegate2, DelegateTypes.sigAuth)
        })

        it('resolves document', async () => {
          const resolution = await resolver.resolve(did)
          return expect(resolution.didDocument).toEqual({
            '@context': [
              'https://www.w3.org/ns/did/v1',
              'https://identity.foundation/EcdsaSecp256k1RecoverySignature2020/lds-ecdsa-secp256k1-recovery2020-0.0.jsonld',
            ],
            id: did,
            verificationMethod: [
              {
                id: `${did}#controller`,
                type: 'EcdsaSecp256k1RecoveryMethod2020',
                controller: did,
                blockchainAccountId: `${owner}@eip155:1337`,
              },
              {
                id: `${did}#delegate-1`,
                type: 'EcdsaSecp256k1RecoveryMethod2020',
                controller: did,
                blockchainAccountId: `${delegate1}@eip155:1337`,
              },
            ],
            authentication: [`${did}#controller`],
          })
        })
      })
    })

    describe('attributes', () => {
      describe('publicKey', () => {
        describe('Secp256k1VerificationKey2018', () => {
          beforeAll(async () => {
            await ethrDid.setAttribute(
              'did/pub/Secp256k1/veriKey',
              '0x02b97c30de767f084ce3080168ee293053ba33b235d7116a3263d29f1450936b71',
              10
            )
          })

          it('resolves document', async () => {
            return expect((await resolver.resolve(did)).didDocument).toEqual({
              '@context': [
                'https://www.w3.org/ns/did/v1',
                'https://identity.foundation/EcdsaSecp256k1RecoverySignature2020/lds-ecdsa-secp256k1-recovery2020-0.0.jsonld',
              ],
              id: did,
              verificationMethod: [
                {
                  id: `${did}#controller`,
                  type: 'EcdsaSecp256k1RecoveryMethod2020',
                  controller: did,
                  blockchainAccountId: `${owner}@eip155:1337`,
                },
                {
                  id: `${did}#delegate-1`,
                  type: 'EcdsaSecp256k1RecoveryMethod2020',
                  controller: did,
                  blockchainAccountId: `${delegate1}@eip155:1337`,
                },
                {
                  id: `${did}#delegate-5`,
                  type: 'EcdsaSecp256k1VerificationKey2019',
                  controller: did,
                  publicKeyHex: '02b97c30de767f084ce3080168ee293053ba33b235d7116a3263d29f1450936b71',
                },
              ],
              authentication: [`${did}#controller`],
            })
          })
        })

        describe('Base64 Encoded Key', () => {
          beforeAll(async () => {
            await ethrDid.setAttribute(
              'did/pub/Ed25519/veriKey/base64',
              'Arl8MN52fwhM4wgBaO4pMFO6M7I11xFqMmPSnxRQk2tx',
              10
            )
          })

          it('resolves document', async () => {
            return expect((await resolver.resolve(did)).didDocument).toEqual({
              '@context': [
                'https://www.w3.org/ns/did/v1',
                'https://identity.foundation/EcdsaSecp256k1RecoverySignature2020/lds-ecdsa-secp256k1-recovery2020-0.0.jsonld',
              ],
              id: did,
              verificationMethod: [
                {
                  id: `${did}#controller`,
                  type: 'EcdsaSecp256k1RecoveryMethod2020',
                  controller: did,
                  blockchainAccountId: `${owner}@eip155:1337`,
                },
                {
                  id: `${did}#delegate-1`,
                  type: 'EcdsaSecp256k1RecoveryMethod2020',
                  controller: did,
                  blockchainAccountId: `${delegate1}@eip155:1337`,
                },
                {
                  id: `${did}#delegate-5`,
                  type: 'EcdsaSecp256k1VerificationKey2019',
                  controller: did,
                  publicKeyHex: '02b97c30de767f084ce3080168ee293053ba33b235d7116a3263d29f1450936b71',
                },
                {
                  id: `${did}#delegate-6`,
                  type: 'Ed25519VerificationKey2018',
                  controller: did,
                  publicKeyBase64: 'Arl8MN52fwhM4wgBaO4pMFO6M7I11xFqMmPSnxRQk2tx',
                },
              ],
              authentication: [`${did}#controller`],
            })
          })
        })

        describe('Use Buffer', () => {
          beforeAll(async () => {
            await ethrDid.setAttribute(
              'did/pub/Ed25519/veriKey/base64',
              Buffer.from('f2b97c30de767f084ce3080168ee293053ba33b235d7116a3263d29f1450936b72', 'hex'),
              10
            )
          })

          it('resolves document', async () => {
            return expect((await resolver.resolve(did)).didDocument).toEqual({
              '@context': [
                'https://www.w3.org/ns/did/v1',
                'https://identity.foundation/EcdsaSecp256k1RecoverySignature2020/lds-ecdsa-secp256k1-recovery2020-0.0.jsonld',
              ],
              id: did,
              verificationMethod: [
                {
                  id: `${did}#controller`,
                  type: 'EcdsaSecp256k1RecoveryMethod2020',
                  controller: did,
                  blockchainAccountId: `${owner}@eip155:1337`,
                },
                {
                  id: `${did}#delegate-1`,
                  type: 'EcdsaSecp256k1RecoveryMethod2020',
                  controller: did,
                  blockchainAccountId: `${delegate1}@eip155:1337`,
                },
                {
                  id: `${did}#delegate-5`,
                  type: 'EcdsaSecp256k1VerificationKey2019',
                  controller: did,
                  publicKeyHex: '02b97c30de767f084ce3080168ee293053ba33b235d7116a3263d29f1450936b71',
                },
                {
                  id: `${did}#delegate-6`,
                  type: 'Ed25519VerificationKey2018',
                  controller: did,
                  publicKeyBase64: 'Arl8MN52fwhM4wgBaO4pMFO6M7I11xFqMmPSnxRQk2tx',
                },
                {
                  id: `${did}#delegate-7`,
                  type: 'Ed25519VerificationKey2018',
                  controller: did,
                  publicKeyBase64: '8rl8MN52fwhM4wgBaO4pMFO6M7I11xFqMmPSnxRQk2ty',
                },
              ],
              authentication: [`${did}#controller`],
            })
          })
        })
      })

      describe('service endpoints', () => {
        describe('HubService', () => {
          beforeAll(async () => {
            await ethrDid.setAttribute('did/svc/HubService', 'https://hubs.uport.me', 100)
          })
          it('resolves document', async () => {
            return expect((await resolver.resolve(did)).didDocument).toEqual({
              '@context': [
                'https://www.w3.org/ns/did/v1',
                'https://identity.foundation/EcdsaSecp256k1RecoverySignature2020/lds-ecdsa-secp256k1-recovery2020-0.0.jsonld',
              ],
              id: did,
              verificationMethod: [
                {
                  id: `${did}#controller`,
                  type: 'EcdsaSecp256k1RecoveryMethod2020',
                  controller: did,
                  blockchainAccountId: `${owner}@eip155:1337`,
                },
                {
                  id: `${did}#delegate-1`,
                  type: 'EcdsaSecp256k1RecoveryMethod2020',
                  controller: did,
                  blockchainAccountId: `${delegate1}@eip155:1337`,
                },
                {
                  id: `${did}#delegate-5`,
                  type: 'EcdsaSecp256k1VerificationKey2019',
                  controller: did,
                  publicKeyHex: '02b97c30de767f084ce3080168ee293053ba33b235d7116a3263d29f1450936b71',
                },
                {
                  id: `${did}#delegate-6`,
                  type: 'Ed25519VerificationKey2018',
                  controller: did,
                  publicKeyBase64: 'Arl8MN52fwhM4wgBaO4pMFO6M7I11xFqMmPSnxRQk2tx',
                },
                {
                  id: `${did}#delegate-7`,
                  type: 'Ed25519VerificationKey2018',
                  controller: did,
                  publicKeyBase64: '8rl8MN52fwhM4wgBaO4pMFO6M7I11xFqMmPSnxRQk2ty',
                },
              ],
              authentication: [`${did}#controller`],
              service: [
                {
                  id: 'did:ethr:dev:0x7E5F4552091A69125d5DfCb7b8C2659029395Bdf#service-1',
                  type: 'HubService',
                  serviceEndpoint: 'https://hubs.uport.me',
                },
              ],
            })
          })
        })

        describe('revoke HubService', () => {
          beforeAll(async () => {
            await ethrDid.revokeAttribute('did/svc/HubService', 'https://hubs.uport.me')
          })
          it('resolves document', async () => {
            return expect((await resolver.resolve(did)).didDocument).toEqual({
              '@context': [
                'https://www.w3.org/ns/did/v1',
                'https://identity.foundation/EcdsaSecp256k1RecoverySignature2020/lds-ecdsa-secp256k1-recovery2020-0.0.jsonld',
              ],
              id: did,
              verificationMethod: [
                {
                  id: `${did}#controller`,
                  type: 'EcdsaSecp256k1RecoveryMethod2020',
                  controller: did,
                  blockchainAccountId: `${owner}@eip155:1337`,
                },
                {
                  id: `${did}#delegate-1`,
                  type: 'EcdsaSecp256k1RecoveryMethod2020',
                  controller: did,
                  blockchainAccountId: `${delegate1}@eip155:1337`,
                },
                {
                  id: `${did}#delegate-5`,
                  type: 'EcdsaSecp256k1VerificationKey2019',
                  controller: did,
                  publicKeyHex: '02b97c30de767f084ce3080168ee293053ba33b235d7116a3263d29f1450936b71',
                },
                {
                  id: `${did}#delegate-6`,
                  type: 'Ed25519VerificationKey2018',
                  controller: did,
                  publicKeyBase64: 'Arl8MN52fwhM4wgBaO4pMFO6M7I11xFqMmPSnxRQk2tx',
                },
                {
                  id: `${did}#delegate-7`,
                  type: 'Ed25519VerificationKey2018',
                  controller: did,
                  publicKeyBase64: '8rl8MN52fwhM4wgBaO4pMFO6M7I11xFqMmPSnxRQk2ty',
                },
              ],
              authentication: [`${did}#controller`],
            })
          })
        })
      })
    })
  })

  describe('signJWT', () => {
    describe('No signer configured', () => {
      it('should fail', () => {
        return expect(ethrDid.signJWT({ hello: 'world' })).rejects.toEqual(new Error('No signer configured'))
      })
    })

    describe('creating a signing Delegate', () => {
      let kp: KeyPair
      beforeAll(async () => {
        kp = (await ethrDid.createSigningDelegate()).kp
      })

      it('resolves document', async () => {
        return expect((await resolver.resolve(did)).didDocument).toEqual({
          '@context': [
            'https://www.w3.org/ns/did/v1',
            'https://identity.foundation/EcdsaSecp256k1RecoverySignature2020/lds-ecdsa-secp256k1-recovery2020-0.0.jsonld',
          ],
          id: did,
          verificationMethod: [
            {
              id: `${did}#controller`,
              type: 'EcdsaSecp256k1RecoveryMethod2020',
              controller: did,
              blockchainAccountId: `${owner}@eip155:1337`,
            },
            {
              id: `${did}#delegate-1`,
              type: 'EcdsaSecp256k1RecoveryMethod2020',
              controller: did,
              blockchainAccountId: `${delegate1}@eip155:1337`,
            },
            {
              id: `${did}#delegate-5`,
              type: 'EcdsaSecp256k1VerificationKey2019',
              controller: did,
              publicKeyHex: '02b97c30de767f084ce3080168ee293053ba33b235d7116a3263d29f1450936b71',
            },
            {
              id: `${did}#delegate-6`,
              type: 'Ed25519VerificationKey2018',
              controller: did,
              publicKeyBase64: 'Arl8MN52fwhM4wgBaO4pMFO6M7I11xFqMmPSnxRQk2tx',
            },
            {
              id: `${did}#delegate-7`,
              type: 'Ed25519VerificationKey2018',
              controller: did,
              publicKeyBase64: '8rl8MN52fwhM4wgBaO4pMFO6M7I11xFqMmPSnxRQk2ty',
            },
            {
              id: `${did}#delegate-8`,
              type: 'EcdsaSecp256k1RecoveryMethod2020',
              controller: did,
              blockchainAccountId: `${kp.address}@eip155:1337`,
            },
          ],
          authentication: [`${did}#controller`],
        })
      })

      it('should sign valid jwt', () => {
        return ethrDid.signJWT({ hello: 'world' }).then((jwt: string) =>
          verifyJWT(jwt, { resolver }).then(
            ({ signer }) =>
              expect(signer).toEqual({
                id: `${did}#delegate-8`,
                type: 'EcdsaSecp256k1RecoveryMethod2020',
                controller: did,
                blockchainAccountId: `${kp.address}@eip155:1337`,
              }),
            (error) => expect(error).toBeNull()
          )
        )
      })
    })

    describe('plain vanilla keypair account', () => {
      it('should sign valid jwt', async () => {
        const kp: KeyPair = EthrDID.createKeyPair()
        plainDid = new EthrDID({
          identifier: kp.publicKey,
          privateKey: kp.privateKey,
          provider,
          registry: registry,
          chainNameOrId: 'dev',
        })
        const jwt = await plainDid.signJWT({ hello: 'world' })
        const { payload } = await verifyJWT(jwt, { resolver })
        expect(payload).toBeDefined()
      })
    })
  })

  describe('verifyJWT', () => {
    const kp: KeyPair = EthrDID.createKeyPair()
    const ethrDid = new EthrDID({
      identifier: kp.publicKey,
      privateKey: kp.privateKey,
      chainNameOrId: 'dev',
    })
    const did = ethrDid.did

    it('verifies the signature of the JWT', async () => {
      return ethrDid
        .signJWT({ hello: 'friend' })
        .then((jwt) => plainDid.verifyJWT(jwt, resolver))
        .then(({ issuer }) => expect(issuer).toEqual(did))
    })

    describe('uses did for verifying aud claim', () => {
      it('verifies the signature of the JWT', () => {
        return ethrDid
          .signJWT({ hello: 'friend', aud: plainDid.did })
          .then((jwt) => plainDid.verifyJWT(jwt, resolver))
          .then(({ issuer }) => expect(issuer).toEqual(did))
      })

      it('fails if wrong did', () => {
        return ethrDid
          .signJWT({ hello: 'friend', aud: plainDid.did })
          .then((jwt) => plainDid.verifyJWT(jwt, resolver))
          .catch((error) =>
            expect(error.message).toEqual(
              `JWT audience does not match your DID: aud: ${ethrDid.did} !== yours: ${plainDid.did}`
            )
          )
      })
    })
  })

  describe('Large key', () => {
    const rsa4096PublicKey = `-----BEGIN PUBLIC KEY-----
            MIICIjANBgkqhkiG9w0BAQEFAAOCAg8AMIICCgKCAgEAolN9csarxOP++9pbjLE/
            /ybicmTGL0+or6LmLkos9YEXOb8w1RaoQoLuPNbCqfHlnbiPdvl9zdVHCswf9DwK
            Ba6ecs0Vr3OW3FTSyejHiqinkfmEgRKOoAf7S8nQcsiDzANPondL+1z+dgmo8nTK
            9806ei8LYzKzLjpi+SmdtTVvUQZGuxAT1GuzzT5jyE+MyR2zwSaCTyNC6zwnk51i
            z+zf8WRNe32WtBLhNbz6MKlwup1CSear9oeZQJRQspkud7b84Clv6QeOCPqMuRLy
            ibM8J+BC5cRyxVyV2rHshvD134cbR6uEIsggoC9NvvZcaJlcG25gA7rUrIJ8CGEG
            9WZsmqUfrykOJ3HFqGyJZlpVq0hHM6ikcexdbqPFcwj9Vcx3yecb6WABZCeYVHDw
            3AoGu/Y/m2xJ7L3iPCWcpB94y0e7Yp3M6S8Y4RpL2iEykCXd7CVYVV1QVPz4/5D8
            mT4S4PG0I0/yBbblUz9CcYSJ/9eFOekSRY7TAEEJcrBY7MkXZcNRwcFtgi9PWpaC
            XTsIYri2eBKqAgFT9xaPiFCFYJlpfUe81pgp+5mZsObYlB0AKJb7o0rRa5XLO4JL
            ZiovTaqHZW9gvO3KZyJNYx7XM9Vjwm4FB5NUxSvqHJyUgGC6H7jwK2wKtrThrjkt
            P9+7B63q+4nzilC9UUHEIosCAwEAAQ==
            -----END PUBLIC KEY-----`

    beforeAll(async () => {
      await ethrDid.setAttribute('did/pub/Rsa/veriKey/pem', rsa4096PublicKey, 86400, 200000)
    })

    it('should create add the large RSA key in the hex format', async () => {
      const didDocument = (await resolver.resolve(did)).didDocument
      const pk = didDocument?.verificationMethod?.find((pk) => {
        return typeof (<any>pk).publicKeyPem !== 'undefined'
      })
      expect((<any>pk).publicKeyPem).toEqual(rsa4096PublicKey)
    })
  })
})

import { Resolver } from 'did-resolver'
import { getResolver, delegateTypes } from 'ethr-did-resolver'
import EthrDID from '../index'
import Contract from 'truffle-contract'
import DidRegistryContract from 'ethr-did-registry'
import Web3 from 'web3'
import ganache from 'ganache-cli'
import { verifyJWT } from 'did-jwt'

const { Secp256k1SignatureAuthentication2018 } = delegateTypes

function sleep (seconds) {
  return new Promise(resolve => setTimeout(resolve, seconds * 1000))
}

describe('EthrDID', () => {
  let ethrDid,
    plainDid,
    registry,
    accounts,
    did,
    identity,
    owner,
    delegate1,
    delegate2,
    provider,
    resolver

  beforeAll(async () => {
    provider = ganache.provider()
    const DidReg = Contract(DidRegistryContract)
    const web3 = new Web3()
    web3.setProvider(provider)
    const getAccounts = () =>
      new Promise((resolve, reject) =>
        web3.eth.getAccounts((error, accounts) =>
          error ? reject(error) : resolve(accounts)
        )
      )
    DidReg.setProvider(provider)
    accounts = await getAccounts()
    identity = accounts[1].toLowerCase()
    owner = accounts[2].toLowerCase()
    delegate1 = accounts[3].toLowerCase()
    delegate2 = accounts[4].toLowerCase()
    did = `did:ethr:${identity}`

    registry = await DidReg.new({
      from: accounts[0],
      gasPrice: 100000000000,
      gas: 4712388
    })
    ethrDid = new EthrDID({
      provider,
      registry: registry.address,
      address: identity
    })
    resolver = new Resolver(
      getResolver({ provider, registry: registry.address })
    )
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

      it('resolves document', () => {
        return expect(resolver.resolve(did)).resolves.toEqual({
          '@context': 'https://w3id.org/did/v1',
          id: did,
          publicKey: [
            {
              id: `${did}#controller`,
              type: 'Secp256k1VerificationKey2018',
              controller: did,
              ethereumAddress: owner
            }
          ],
          authentication: [
            {
              type: 'Secp256k1SignatureAuthentication2018',
              publicKey: `${did}#controller`
            }
          ]
        })
      })
    })

    describe('delegates', () => {
      describe('add signing delegate', () => {
        beforeAll(async () => {
          await ethrDid.addDelegate(delegate1, { expiresIn: 2 })
        })

        it('resolves document', () => {
          return expect(resolver.resolve(did)).resolves.toEqual({
            '@context': 'https://w3id.org/did/v1',
            id: did,
            publicKey: [
              {
                id: `${did}#controller`,
                type: 'Secp256k1VerificationKey2018',
                controller: did,
                ethereumAddress: owner
              },
              {
                id: `${did}#delegate-1`,
                type: 'Secp256k1VerificationKey2018',
                controller: did,
                ethereumAddress: delegate1
              }
            ],
            authentication: [
              {
                type: 'Secp256k1SignatureAuthentication2018',
                publicKey: `${did}#controller`
              }
            ]
          })
        })
      })

      describe('add auth delegate', () => {
        beforeAll(async () => {
          await ethrDid.addDelegate(delegate2, {
            delegateType: Secp256k1SignatureAuthentication2018,
            expiresIn: 10
          })
        })

        it('resolves document', () => {
          return expect(resolver.resolve(did)).resolves.toEqual({
            '@context': 'https://w3id.org/did/v1',
            id: did,
            publicKey: [
              {
                id: `${did}#controller`,
                type: 'Secp256k1VerificationKey2018',
                controller: did,
                ethereumAddress: owner
              },
              {
                id: `${did}#delegate-1`,
                type: 'Secp256k1VerificationKey2018',
                controller: did,
                ethereumAddress: delegate1
              },
              {
                id: `${did}#delegate-2`,
                type: 'Secp256k1VerificationKey2018',
                controller: did,
                ethereumAddress: delegate2
              }
            ],
            authentication: [
              {
                type: 'Secp256k1SignatureAuthentication2018',
                publicKey: `${did}#controller`
              },
              {
                type: 'Secp256k1SignatureAuthentication2018',
                publicKey: `${did}#delegate-2`
              }
            ]
          })
        })
      })

      describe('expire automatically', () => {
        beforeAll(async () => {
          await sleep(3)
        })

        it('resolves document', () => {
          return expect(resolver.resolve(did)).resolves.toEqual({
            '@context': 'https://w3id.org/did/v1',
            id: did,
            publicKey: [
              {
                id: `${did}#controller`,
                type: 'Secp256k1VerificationKey2018',
                controller: did,
                ethereumAddress: owner
              },
              {
                id: `${did}#delegate-1`,
                type: 'Secp256k1VerificationKey2018',
                controller: did,
                ethereumAddress: delegate2
              }
            ],
            authentication: [
              {
                type: 'Secp256k1SignatureAuthentication2018',
                publicKey: `${did}#controller`
              },
              {
                type: 'Secp256k1SignatureAuthentication2018',
                publicKey: `${did}#delegate-1`
              }
            ]
          })
        })
      })

      describe('revokes delegate', () => {
        beforeAll(async () => {
          await ethrDid.revokeDelegate(
            delegate2,
            Secp256k1SignatureAuthentication2018
          )
          await sleep(1)
        })

        it('resolves document', () => {
          return expect(resolver.resolve(did)).resolves.toEqual({
            '@context': 'https://w3id.org/did/v1',
            id: did,
            publicKey: [
              {
                id: `${did}#controller`,
                type: 'Secp256k1VerificationKey2018',
                controller: did,
                ethereumAddress: owner
              }
            ],
            authentication: [
              {
                type: 'Secp256k1SignatureAuthentication2018',
                publicKey: `${did}#controller`
              }
            ]
          })
        })
      })

      describe('re-add auth delegate', () => {
        beforeAll(async () => {
          await ethrDid.addDelegate(delegate2, {
            delegateType: Secp256k1SignatureAuthentication2018
          })
        })

        it('resolves document', () => {
          return expect(resolver.resolve(did)).resolves.toEqual({
            '@context': 'https://w3id.org/did/v1',
            id: did,
            publicKey: [
              {
                id: `${did}#controller`,
                type: 'Secp256k1VerificationKey2018',
                controller: did,
                ethereumAddress: owner
              },
              {
                id: `${did}#delegate-1`,
                type: 'Secp256k1VerificationKey2018',
                controller: did,
                ethereumAddress: delegate2
              }
            ],
            authentication: [
              {
                type: 'Secp256k1SignatureAuthentication2018',
                publicKey: `${did}#controller`
              },
              {
                type: 'Secp256k1SignatureAuthentication2018',
                publicKey: `${did}#delegate-1`
              }
            ]
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

          it('resolves document', () => {
            return expect(resolver.resolve(did)).resolves.toEqual({
              '@context': 'https://w3id.org/did/v1',
              id: did,
              publicKey: [
                {
                  id: `${did}#controller`,
                  type: 'Secp256k1VerificationKey2018',
                  controller: did,
                  ethereumAddress: owner
                },
                {
                  id: `${did}#delegate-1`,
                  type: 'Secp256k1VerificationKey2018',
                  controller: did,
                  ethereumAddress: delegate2
                },
                {
                  id: `${did}#delegate-2`,
                  type: 'Secp256k1VerificationKey2018',
                  controller: did,
                  publicKeyHex:
                    '02b97c30de767f084ce3080168ee293053ba33b235d7116a3263d29f1450936b71'
                }
              ],
              authentication: [
                {
                  type: 'Secp256k1SignatureAuthentication2018',
                  publicKey: `${did}#controller`
                },
                {
                  type: 'Secp256k1SignatureAuthentication2018',
                  publicKey: `${did}#delegate-1`
                }
              ]
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

          it('resolves document', () => {
            return expect(resolver.resolve(did)).resolves.toEqual({
              '@context': 'https://w3id.org/did/v1',
              id: did,
              publicKey: [
                {
                  id: `${did}#controller`,
                  type: 'Secp256k1VerificationKey2018',
                  controller: did,
                  ethereumAddress: owner
                },
                {
                  id: `${did}#delegate-1`,
                  type: 'Secp256k1VerificationKey2018',
                  controller: did,
                  ethereumAddress: delegate2
                },
                {
                  id: `${did}#delegate-2`,
                  type: 'Secp256k1VerificationKey2018',
                  controller: did,
                  publicKeyHex:
                    '02b97c30de767f084ce3080168ee293053ba33b235d7116a3263d29f1450936b71'
                },
                {
                  id: `${did}#delegate-3`,
                  type: 'Ed25519VerificationKey2018',
                  controller: did,
                  publicKeyBase64:
                    'Arl8MN52fwhM4wgBaO4pMFO6M7I11xFqMmPSnxRQk2tx'
                }
              ],
              authentication: [
                {
                  type: 'Secp256k1SignatureAuthentication2018',
                  publicKey: `${did}#controller`
                },
                {
                  type: 'Secp256k1SignatureAuthentication2018',
                  publicKey: `${did}#delegate-1`
                }
              ]
            })
          })
        })

        describe('Use Buffer', () => {
          beforeAll(async () => {
            await ethrDid.setAttribute(
              'did/pub/Ed25519/veriKey/base64',
              Buffer.from(
                'f2b97c30de767f084ce3080168ee293053ba33b235d7116a3263d29f1450936b72',
                'hex'
              ),
              10
            )
          })

          it('resolves document', () => {
            return expect(resolver.resolve(did)).resolves.toEqual({
              '@context': 'https://w3id.org/did/v1',
              id: did,
              publicKey: [
                {
                  id: `${did}#controller`,
                  type: 'Secp256k1VerificationKey2018',
                  controller: did,
                  ethereumAddress: owner
                },
                {
                  id: `${did}#delegate-1`,
                  type: 'Secp256k1VerificationKey2018',
                  controller: did,
                  ethereumAddress: delegate2
                },
                {
                  id: `${did}#delegate-2`,
                  type: 'Secp256k1VerificationKey2018',
                  controller: did,
                  publicKeyHex:
                    '02b97c30de767f084ce3080168ee293053ba33b235d7116a3263d29f1450936b71'
                },
                {
                  id: `${did}#delegate-3`,
                  type: 'Ed25519VerificationKey2018',
                  controller: did,
                  publicKeyBase64:
                    'Arl8MN52fwhM4wgBaO4pMFO6M7I11xFqMmPSnxRQk2tx'
                },
                {
                  id: `${did}#delegate-4`,
                  type: 'Ed25519VerificationKey2018',
                  controller: did,
                  publicKeyBase64:
                    '8rl8MN52fwhM4wgBaO4pMFO6M7I11xFqMmPSnxRQk2ty'
                }
              ],
              authentication: [
                {
                  type: 'Secp256k1SignatureAuthentication2018',
                  publicKey: `${did}#controller`
                },
                {
                  type: 'Secp256k1SignatureAuthentication2018',
                  publicKey: `${did}#delegate-1`
                }
              ]
            })
          })
        })
      })

      describe('service endpoints', () => {
        describe('HubService', () => {
          beforeAll(async () => {
            await ethrDid.setAttribute(
              'did/svc/HubService',
              'https://hubs.uport.me',
              10
            )
          })
          it('resolves document', () => {
            return expect(resolver.resolve(did)).resolves.toEqual({
              '@context': 'https://w3id.org/did/v1',
              id: did,
              publicKey: [
                {
                  id: `${did}#controller`,
                  type: 'Secp256k1VerificationKey2018',
                  controller: did,
                  ethereumAddress: owner
                },
                {
                  id: `${did}#delegate-1`,
                  type: 'Secp256k1VerificationKey2018',
                  controller: did,
                  ethereumAddress: delegate2
                },
                {
                  id: `${did}#delegate-2`,
                  type: 'Secp256k1VerificationKey2018',
                  controller: did,
                  publicKeyHex:
                    '02b97c30de767f084ce3080168ee293053ba33b235d7116a3263d29f1450936b71'
                },
                {
                  id: `${did}#delegate-3`,
                  type: 'Ed25519VerificationKey2018',
                  controller: did,
                  publicKeyBase64: Buffer.from(
                    '02b97c30de767f084ce3080168ee293053ba33b235d7116a3263d29f1450936b71',
                    'hex'
                  ).toString('base64')
                },
                {
                  id: `${did}#delegate-4`,
                  type: 'Ed25519VerificationKey2018',
                  controller: did,
                  publicKeyBase64:
                    '8rl8MN52fwhM4wgBaO4pMFO6M7I11xFqMmPSnxRQk2ty'
                }
              ],
              authentication: [
                {
                  type: 'Secp256k1SignatureAuthentication2018',
                  publicKey: `${did}#controller`
                },
                {
                  type: 'Secp256k1SignatureAuthentication2018',
                  publicKey: `${did}#delegate-1`
                }
              ],
              service: [
                {
                  type: 'HubService',
                  serviceEndpoint: 'https://hubs.uport.me'
                }
              ]
            })
          })
        })

        describe('revoke HubService', () => {
          beforeAll(async () => {
            await ethrDid.revokeAttribute(
              'did/svc/HubService',
              'https://hubs.uport.me'
            )
          })
          it('resolves document', () => {
            return expect(resolver.resolve(did)).resolves.toEqual({
              '@context': 'https://w3id.org/did/v1',
              id: did,
              publicKey: [
                {
                  id: `${did}#controller`,
                  type: 'Secp256k1VerificationKey2018',
                  controller: did,
                  ethereumAddress: owner
                },
                {
                  id: `${did}#delegate-1`,
                  type: 'Secp256k1VerificationKey2018',
                  controller: did,
                  ethereumAddress: delegate2
                },
                {
                  id: `${did}#delegate-2`,
                  type: 'Secp256k1VerificationKey2018',
                  controller: did,
                  publicKeyHex:
                    '02b97c30de767f084ce3080168ee293053ba33b235d7116a3263d29f1450936b71'
                },
                {
                  id: `${did}#delegate-3`,
                  type: 'Ed25519VerificationKey2018',
                  controller: did,
                  publicKeyBase64: Buffer.from(
                    '02b97c30de767f084ce3080168ee293053ba33b235d7116a3263d29f1450936b71',
                    'hex'
                  ).toString('base64')
                },
                {
                  id: `${did}#delegate-4`,
                  type: 'Ed25519VerificationKey2018',
                  controller: did,
                  publicKeyBase64:
                    '8rl8MN52fwhM4wgBaO4pMFO6M7I11xFqMmPSnxRQk2ty'
                }
              ],
              authentication: [
                {
                  type: 'Secp256k1SignatureAuthentication2018',
                  publicKey: `${did}#controller`
                },
                {
                  type: 'Secp256k1SignatureAuthentication2018',
                  publicKey: `${did}#delegate-1`
                }
              ]
            })
          })
        })
      })
    })
  })

  describe('signJWT', () => {
    describe('No signer configured', () => {
      it('should fail', () => {
        return expect(ethrDid.signJWT({ hello: 'world' })).rejects.toEqual(
          new Error('No signer configured')
        )
      })
    })

    describe('creating a signing Delegate', () => {
      let kp
      beforeAll(async () => {
        kp = (await ethrDid.createSigningDelegate()).kp
      })

      it('resolves document', () => {
        return expect(resolver.resolve(did)).resolves.toEqual({
          '@context': 'https://w3id.org/did/v1',
          id: did,
          publicKey: [
            {
              id: `${did}#controller`,
              type: 'Secp256k1VerificationKey2018',
              controller: did,
              ethereumAddress: owner
            },
            {
              id: `${did}#delegate-1`,
              type: 'Secp256k1VerificationKey2018',
              controller: did,
              ethereumAddress: delegate2
            },
            {
              id: `${did}#delegate-2`,
              type: 'Secp256k1VerificationKey2018',
              controller: did,
              publicKeyHex:
                '02b97c30de767f084ce3080168ee293053ba33b235d7116a3263d29f1450936b71'
            },
            {
              id: `${did}#delegate-3`,
              type: 'Ed25519VerificationKey2018',
              controller: did,
              publicKeyBase64: Buffer.from(
                '02b97c30de767f084ce3080168ee293053ba33b235d7116a3263d29f1450936b71',
                'hex'
              ).toString('base64')
            },
            {
              id: `${did}#delegate-4`,
              type: 'Ed25519VerificationKey2018',
              controller: did,
              publicKeyBase64: '8rl8MN52fwhM4wgBaO4pMFO6M7I11xFqMmPSnxRQk2ty'
            },
            {
              id: `${did}#delegate-5`,
              type: 'Secp256k1VerificationKey2018',
              controller: did,
              ethereumAddress: kp.address
            }
          ],
          authentication: [
            {
              type: 'Secp256k1SignatureAuthentication2018',
              publicKey: `${did}#controller`
            },
            {
              type: 'Secp256k1SignatureAuthentication2018',
              publicKey: `${did}#delegate-1`
            }
          ]
        })
      })

      it('should sign valid jwt', () => {
        return ethrDid.signJWT({ hello: 'world' }).then(jwt =>
          verifyJWT(jwt, { resolver }).then(
            ({ payload, signer }) =>
              expect(signer).toEqual({
                id: `${did}#delegate-5`,
                type: 'Secp256k1VerificationKey2018',
                controller: did,
                ethereumAddress: kp.address
              }),
            error => expect(error).toBeNull()
          )
        )
      })
    })

    describe('plain vanilla keypair account', () => {
      it('should sign valid jwt', () => {
        const kp = EthrDID.createKeyPair()
        plainDid = new EthrDID({ ...kp, provider, registry: registry.address })
        plainDid
          .signJWT({ hello: 'world' })
          .then(jwt => verifyJWT(jwt, { resolver }))
          .then(({ payload }) => expect(payload).toBeDefined())
      })
    })
  })

  describe('verifyJWT', () => {
    const ethrDid = new EthrDID(EthrDID.createKeyPair())
    const did = ethrDid.did

    it('verifies the signature of the JWT', () => {
      return ethrDid
        .signJWT({ hello: 'friend' })
        .then(jwt => plainDid.verifyJWT(jwt, resolver))
        .then(({ issuer }) => expect(issuer).toEqual(did))
    })

    describe('uses did for verifying aud claim', () => {
      it('verifies the signature of the JWT', () => {
        return ethrDid
          .signJWT({ hello: 'friend', aud: plainDid.did })
          .then(jwt => plainDid.verifyJWT(jwt, resolver))
          .then(({ issuer }) => expect(issuer).toEqual(did))
      })

      it('fails if wrong did', () => {
        return ethrDid
          .signJWT({ hello: 'friend', aud: plainDid.did })
          .then(jwt => plainDid.verifyJWT(jwt, resolver))
          .catch(error =>
            expect(error.message).toEqual(
              `JWT audience does not match your DID: aud: ${
                ethrDid.did
              } !== yours: ${plainDid.did}`
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
      await ethrDid.setAttribute(
        'did/pub/Rsa/veriKey/pem',
        rsa4096PublicKey,
        86400,
        200000
      )
    })

    it('should create add the large RSA key in the hex format', async () => {
      const didDocument = await resolver.resolve(did)
      const returnedValue = didDocument.publicKey[6].publicKeyPem
      expect(returnedValue).toEqual(rsa4096PublicKey)
    })
  })
})
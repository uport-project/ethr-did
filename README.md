[![Discord](https://img.shields.io/discord/878293684620234752?logo=discord&logoColor=white&style=flat-square)](https://discord.gg/huwyNfVkhe)
[![npm](https://img.shields.io/npm/dt/ethr-did.svg)](https://www.npmjs.com/package/ethr-did)
[![npm](https://img.shields.io/npm/v/ethr-did.svg)](https://www.npmjs.com/package/ethr-did)
[![GitHub Discussions](https://img.shields.io/github/discussions/uport-project/veramo?style=flat)](https://github.com/uport-project/veramo/discussions)
[![Twitter Follow](https://img.shields.io/twitter/follow/veramolabs.svg?style=social&label=Follow)](https://twitter.com/veramolabs)

# Ethr-DID Library

[DID Specification](https://w3c.github.io/did-core/) | [ERC-1056](https://github.com/ethereum/EIPs/issues/1056)
| [Getting Started](/docs/guides/index.md)

This library conforms to [ERC-1056](https://github.com/ethereum/EIPs/issues/1056) and is intended to use Ethereum
addresses as fully self-managed [Decentralized Identifiers](https://w3c.github.io/did-core/#identifier) (DIDs), it
allows you to easily create and manage keys for these identifiers. It also lets you sign standards
compliant [JSON Web Tokens (JWT)](https://jwt.io) that can be consumed using
the [DID-JWT](https://github.com/decentralized-identity/did-jwt) library.

This library can be used to create a new ethr-did identifier. It allows ethr-did identifiers to be represented as an
object that can perform actions such as updating its DID document, signing messages, and verifying messages from other
DIDs.

Use this if you are looking for the easiest way to start using ethr-did identifiers, and want high-level abstractions to
access its entire range of capabilities. It encapsulates all the functionality
of [ethr-did-resolver](https://github.com/decentralized-identity/ethr-did-resolver)
and [ethr-did-registry](https://github.com/uport-project/ethr-did-registry).

A DID is an Identifier that allows you to lookup a DID document that can be used to authenticate you and messages
created by you.

Ethr-DID provides a scalable identity method for public keys and Ethereum addresses that gives them the ability to
collect on-chain and off-chain data. Because Ethr-DID allows any Ethereum key pair to become a DID, it is more scalable
and privacy-preserving than smart contract based identity methods, like our
previous [Proxy Contract](https://github.com/uport-project/uport-identity/blob/develop/docs/reference/proxy.md).

This particular DID method relies on the [Ethr-Did-Registry](https://github.com/uport-project/ethr-did-registry). The
Ethr-DID-Registry is a smart contract that facilitates public key resolution for off-chain (and on-chain)
authentication. It also facilitates key rotation, delegate assignment and revocation to allow 3rd party signers on a
key's behalf, as well as setting and revoking off-chain attribute data. These interactions and events are used in
aggregate to form a DID's DID document using
the [Ethr-Did-Resolver](https://github.com/decentralized-identity/ethr-did-resolver)
.

An example of a DID document resolved using
the [ethr-did-resolver](https://github.com/decentralized-identity/ethr-did-resolver):

```json5
{
  '@context': [
    'https://www.w3.org/ns/did/v1',
    'https://w3id.org/security/suites/secp256k1recovery-2020/v2'
  ],
  id: 'did:ethr:0xb9c5714089478a327f09197987f16f9e5d936e8a',
  verificationMethod: [
    {
      id: 'did:ethr:0xb9c5714089478a327f09197987f16f9e5d936e8a#controller',
      type: 'EcdsaSecp256k1RecoveryMethod2020',
      controller: 'did:ethr:0xb9c5714089478a327f09197987f16f9e5d936e8a',
      blockchainAccountId: 'eip155:1:0xb9c5714089478a327f09197987f16f9e5d936e8a'
    }
  ],
  assertionMethod: [
    'did:ethr:0xb9c5714089478a327f09197987f16f9e5d936e8a#controller'
  ],
  authentication: [
    'did:ethr:0xb9c5714089478a327f09197987f16f9e5d936e8a#controller'
  ]
}
```

On-chain refers to something that queried or modified with a transaction on a blockchain, while off-chain can refer to
anything from temporary payment channels to IPFS and regular web services.

It supports the proposed [Decentralized Identifiers](https://w3c.github.io/did-core/) spec from
the [W3C Credentials Community Group](https://w3c-ccg.github.io).

## DID Method

A "DID method" is a specific implementation of a DID scheme that is identified by a `method name`. In this case, the
method name is `ethr`, and the method identifier is an Ethereum address or a `secp256k1` publicKey.

To encode a DID for an Ethereum address, simply prepend `did:ethr:`

For example:

* DID based on an ethereum address: `did:ethr:0xf3beac30c498d9e26865f34fcaa57dbb935b0d74`
* DID based on a key: `did:ethr:0x0279be667ef9dcbbac55a06295ce870b07029bfcdb2dce28d959f2815b16f81798`

## Configuration

```typescript
import { EthrDID } from 'ethr-did'

const chainNameOrId = 1 // mainnet
const provider = InfuraProvider("<infura project ID>", chainNameOrId)
const ethrDid = new EthrDID({ identifier: '0x...', privateKey: '...', provider, chainNameOrId })
```

| key | description| required |
|-----|------------|----------|
|`identifier`|Ethereum address, public key or a full `did:ethr` representing Identity| yes |
|`chainNameOrId`|The name or chainId of the ethereum network (defaults to 'mainnet') | no, but recommended |
|`registry`| registry address (defaults to `0xdca7ef03e98e0dc2b855be647c39abe984fcf21b`) | no |
|`provider`| web3 provider | either `provider` or `web3` or `rpcUrl` |
|`web3`| preconfigured web3 object | either `provider` or `web3` or `rpcUrl` |
|`rpcUrl`| JSON-RPC endpoint url | either `provider` or `web3` or `rpcUrl` |
|`signer`| [JWS Signing function](https://github.com/uport-project/did-jwt#signer-functions)| either `signer` or `privateKey` |
|`txSigner`| [Ethers.js Signer](https://docs.ethers.io/v5/api/signer/#Signer)| either `txSigner` or `privateKey` |
|`privateKey`| Hex encoded private key | yes* |

### Important notes on keys and signers

If `privateKey` is specified, then `signer` and `txSigner` don't need to be used. Otherwise, a `txSigner` is required to
perform CRUD operations on the DID document, and a `signer` is required to sign JWTs. To generate valid JWT,
the `signer` must use one of the keys listed in the DID document. To be able to perform CRUD operations, the `txSigner`
must be backed by the key that governs the `owner` property.
See https://github.com/uport-project/ethr-did-registry#looking-up-identity-ownership

## Notes

### Readonly ethr-did

An instance created using only an address or publicKey (without access to a privateKey or to signers) can only be used
to encapsulate an external ethr-did . This instance will not have the ability to sign anything, but it can be used for a
subset of actions:

* provide its own address (`ethrDid.address`)
* provide the full DID string (`ethrDid.did`)
* lookup its owner `await ethrDid.lookupOwner()`
* verify a JWT `await ethrDid.verifyJwt(jwt)`

### Multiple ethereum networks

EthrDid can be configured to control a DID on any ethereum network. To do this, you mush specify the `chainNameOrId`
during construction. Example:

```ts
console.log(new EthrDID({ identifier: '0xb9c5714089478a327f09197987f16f9e5d936e8a', chainNameOrId: 'goerli' }).did)
// did:ethr:goerli:0xB9C5714089478a327F09197987f16f9E5d936E8a
```

If this property is not specified, then the library will attempt to infer it from the `provider` configuration or from
the `identifier` if it is specified as a DID. But, be warned that it may lead to inconsistencies since the inference is
not perfect. It is highly recommended that you use a `chainNameOrId` property to match the `provider`.

### More

See [the guide](./docs/guides/index.md) to get a better idea about the capabilities of this lib. And, of course, make
sure to familiarize yourself with
the [`did:ethr` spec](https://github.com/decentralized-identity/ethr-did-resolver/blob/master/doc/did-method-spec.md)

[![npm](https://img.shields.io/npm/dt/ethr-did.svg)](https://www.npmjs.com/package/ethr-did)
[![npm](https://img.shields.io/npm/v/ethr-did.svg)](https://www.npmjs.com/package/ethr-did)
[![Join the chat at](https://img.shields.io/badge/Riot-Join%20chat-green.svg)](https://chat.uport.me/#/login)
[![Twitter Follow](https://img.shields.io/twitter/follow/uport_me.svg?style=social&label=Follow)](https://twitter.com/uport_me)

# Ethr-DID Library

[DID Specification](https://w3c-ccg.github.io/did-spec/) | [ERC-1056](https://github.com/ethereum/EIPs/issues/1056)
| [Getting Started](/docs/guides/index.md)

[FAQ and helpdesk support](http://bit.ly/uPort_helpdesk)

This library conforms to [ERC-1056](https://github.com/ethereum/EIPs/issues/1056) and is intended to use Ethereum
addresses as fully
self-managed [Decentralized Identifiers](https://w3c-ccg.github.io/did-spec/#decentralized-identifiers-dids) (DIDs), it
allows you to easily create and manage keys for these identities. It also lets you sign standards
compliant [JSON Web Tokens (JWT)](https://jwt.io) that can be consumed using
the [DID-JWT](https://github.com/uport-project/did-jwt) library.

This library can be used to create a new ethr-did identity. It allows ethr-did identities to be represented as an object
that can perform actions such as updating its did-document, signing messages, and verifying messages from other dids.

Use this if you are looking for the easiest way to start using ethr-did identities, and want high-level abstractions to
access its entire range of capabilities. It encapsulates all the functionality
of [ethr-did-resolver](https://github.com/decentralized-identity/ethr-did-resolver)
and [ethr-did-registry](https://github.com/uport-project/ethr-did-registry).

A DID is an Identifier that allows you to lookup a DID document that can be used to authenticate you and messages
created by you.

Ethr-DID provides a scalable identity method for Ethereum addresses that gives any Ethereum address the ability to
collect on-chain and off-chain data. Because Ethr-DID allows any Ethereum key pair to become an identity, it is more
scalable and privacy-preserving than smart contract based identity methods, like our
previous [Proxy Contract](https://github.com/uport-project/uport-identity/blob/develop/docs/reference/proxy.md).

This particular DID method relies on the [Ethr-Did-Registry](https://github.com/uport-project/ethr-did-registry). The
Ethr-DID-Registry is a smart contract that facilitates public key resolution for off-chain (and on-chain)
authentication. It also facilitates key rotation, delegate assignment and revocation to allow 3rd party signers on a
key's behalf, as well as setting and revoking off-chain attribute data. These interactions and events are used in
aggregate to form a DID's DID document using the [Ethr-Did-Resolver](https://github.com/uport-project/ethr-did-resolver)
.

An example of a DID document resolved using the Ethr-Did-Resolver:

```javascript
{
  '@context': [
    'https://www.w3.org/ns/did/v1',
    'https://identity.foundation/EcdsaSecp256k1RecoverySignature2020/lds-ecdsa-secp256k1-recovery2020-0.0.jsonld'
  ],
  id: 'did:ethr:0xb9c5714089478a327f09197987f16f9e5d936e8a',
  verificationMethod: [
    {
      id: `did:ethr:0xb9c5714089478a327f09197987f16f9e5d936e8a#controller`,
      type: 'EcdsaSecp256k1RecoveryMethod2020',
      controller: did,
      blockchainAccountId: `did:ethr:0xb9c5714089478a327f09197987f16f9e5d936e8a@eip155:1`
    }
  ],
  authentication: [`did:ethr:0xb9c5714089478a327f09197987f16f9e5d936e8a#controller`]
}
```

On-chain refers to something that is resolved with a transaction on a blockchain, while off-chain can refer to anything
from temporary payment channels to IPFS.

It supports the proposed [Decentralized Identifiers](https://w3c-ccg.github.io/did-spec/) spec from
the [W3C Credentials Community Group](https://w3c-ccg.github.io).

## DID Method

A "DID method" is a specific implementation of a DID scheme that is identified by a `method name`. In this case, the
method name is `ethr`, and the method identifier is an Ethereum address or a secp256k1 publicKey.

To encode a DID for an Ethereum address, simply prepend `did:ethr:`

For example:

`did:ethr:0xf3beac30c498d9e26865f34fcaa57dbb935b0d74`

## Configuration

```typescript
import { EthrDID } from 'ethr-did'

const chainNameOrId = 1 // mainnet
const provider = InfuraProvider(<infura project ID>, chainNameOrId)
const ethrDid = new EthrDID({identifier: '0x...', privateKey: '...', provider, chainNameOrId})
```

| key | description| required |
|-----|------------|----------|
|`identifier`|Ethereum address, public key or a full `did:ethr` representing Identity| yes |
|`chainNameOrId`|The name or chainId of the ethereum network (defaults to 'mainnet') | no, but recommended |
|`registry`| registry address (defaults to `0xdca7ef03e98e0dc2b855be647c39abe984fcf21b`) | no |
|`provider`| web3 provider | either `provider` or `web3` or `rpcUrl` |
|`web3`| preconfigured web3 object | either `provider` or `web3` or `rpcUrl` |
|`rpcUrl`| JSON-RPC endpoint url | either `provider` or `web3` or `rpcUrl` |
|`signer`| [Signing function](https://github.com/uport-project/did-jwt#signer-functions)| either `signer` or `privateKey` |
|`txSigner`| [Ethers.js Signer](https://docs.ethers.io/v5/api/signer/#Signer)| either `txSigner` or `privateKey` |
|`privateKey`| Hex encoded private key | yes* |

If `privateKey` is specified, then `signer` and `txSigner` don't need to be used.
Otherwise, a `txSigner` is required to perform CRUD operations on the DID document, and a `signer` is required to sign JWTs.
To generate valid JWT, the `signer` must use one of the keys listed in the DID document.
To be able to perform CRUD operations, the `txSigner` must be backed by the key that governs the `owner` property.
See https://github.com/uport-project/ethr-did-registry#looking-up-identity-ownership

## Notes

### Readonly ethr-did
An instance created using only an address or publicKey (without access to a privateKey or to signers) can only be used to
encapsulate an external ethr-did . This instance will not have the ability to sign anything, but it can be used for a subset of
actions:

* provide its own address (`ethrDid.address`)
* provide the full DID string (`ethrDid.did`)
* lookup its owner `await ethrDid.lookupOwner()`
* verify a JWT `await ethrDid.verifyJwt(jwt)`

### Multiple ethereum networks
EthrDid can be configured to control a DID on any ethereum network.
To do this, you mush specify the `chainNameOrId` during construction.
Example:
```ts
console.log( new EthrDid({ '0xb9c5714089478a327f09197987f16f9e5d936e8a', 'rinkeby' }).did )
// did:ethr:rinkeby:0xb9c5714089478a327f09197987f16f9e5d936e8a
```

If this property is not specified, then the library will attempt to infer it from the `provider` configuration or from the
`identifier` if it is specified as a DID. But, be warned that it may lead to inconsistencies since the inference is not perfect.
It is highly recommended that you use a `chainNameOrId` property to match the `provider`.

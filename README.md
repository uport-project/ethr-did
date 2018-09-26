# Ethr-DID Library

[![npm](https://img.shields.io/npm/dt/ethr-did.svg)](https://www.npmjs.com/package/ethr-did)
[![npm](https://img.shields.io/npm/v/ethr-did.svg)](https://www.npmjs.com/package/ethr-did)
[![Join the chat at](https://img.shields.io/badge/Riot-Join%20chat-green.svg)](https://chat.uport.me/#/login)
[![Twitter Follow](https://img.shields.io/twitter/follow/uport_me.svg?style=social&label=Follow)](https://twitter.com/uport_me)

[Getting Started](/docs/guides/index.md) 

This library conforms to ERC-1056 and is intended to use Ethereum addresses as fully self-managed [Decentralized Identifiers](https://w3c-ccg.github.io/did-spec/#decentralized-identifiers-dids) (DIDs), it allows you to easily create and manage keys for these identities.  It also lets you sign standards compliant [JSON Web Tokens (JWT)](https://jwt.io) that can be consumed using the [DID-JWT](https://github.com/uport-project/did-jwt) library.

A DID is an Identifier that allows you to lookup a DID document that can be used to authenticate you and messages created by you.

Ethr-DID provides a scalable identity method for Ethereum addresses that gives any Ethereum address the ability to collect on-chain and off-chain data. Because Ethr-DID allows any Ethereum key pair to become an identity, it is more scalable and privacy-preserving than smart contract based identity methods, like our previous [Proxy Contract](https://github.com/uport-project/uport-identity/blob/develop/docs/reference/proxy.md).

This particular DID method relies on the [Ethr-Did-Registry](https://github.com/uport-project/ethr-did-registry). The Ethr-DID-Registry is a smart contract that facilitates public key resolution for off-chain (and on-chain) authentication. It also facilitates key rotation, delegate assignment and revocation to allow 3rd party signers on a key's behalf, as well as setting and revoking off-chain attribute data. These interactions and events are used in aggregate to form a DID's DID document using the [Ethr-Did-Resolver](https://github.com/uport-project/ethr-did-resolver).

An example of a DID document resolved using the Ethr-Did-Resolver:

```
{
  '@context': 'https://w3id.org/did/v1',
  id: 'did:ethr:0xb9c5714089478a327f09197987f16f9e5d936e8a',
  publicKey: [{
       id: 'did:ethr:0xb9c5714089478a327f09197987f16f9e5d936e8a#owner',
       type: 'Secp256k1VerificationKey2018',
       owner: 'did:ethr:0xb9c5714089478a327f09197987f16f9e5d936e8a',
       ethereumAddress: '0xb9c5714089478a327f09197987f16f9e5d936e8a'}],
  authentication: [{
       type: 'Secp256k1SignatureAuthentication2018',
       publicKey: 'did:ethr:0xb9c5714089478a327f09197987f16f9e5d936e8a#owner'}]
}
```

On-chain refers to something that is resolved with a transaction on a blockchain, while off-chain can refer to anything from temporary payment channels to IPFS.

It supports the proposed [Decentralized Identifiers](https://w3c-ccg.github.io/did-spec/) spec from the [W3C Credentials Community Group](https://w3c-ccg.github.io).


## DID Method

A "DID method" is a specific implementation of a DID scheme that is identified by a `method name`. In this case, the method name is `ethr`, and the method identifier is an Ethereum address.

To encode a DID for an Ethereum address, simply prepend `did:ethr:`


For example:

`did:ethr:0xf3beac30c498d9e26865f34fcaa57dbb935b0d74`

## Configuration

```js
import EthrDID from 'ethr-did'

// Assume web3 object is configured either manually or injected using metamask


const ethrDid = new EthrDID({address: '0x...', privateKey: '...', provider})
```

| key | description| required |
|-----|------------|----------|
|`address`|Ethereum address representing Identity| yes |
|`registry`| registry address (defaults to `0xc1b66dea11f8f321b7981e1666fdaf3637fe0f61`) | no |
|`provider`| web3 provider | no |
|`web3`| preconfigured web3 object | no |
|`rpcUrl`| JSON-RPC endpoint url | no |
|`signer`| [Signing function](https://github.com/uport-project/did-jwt#signer-functions)| either `signer` or `privateKey` |
|`privateKey`| Hex encoded private key | yes* |


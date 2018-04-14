# ethr DID library

This library is intended to use ethereum addresses as fully self managed [Decentralized Identifiers](https://w3c-ccg.github.io/did-spec/#decentralized-identifiers-dids) (DIDs) and lets you easily create and manage keys for these identities.

It supports the proposed [Decentralized Identifiers](https://w3c-ccg.github.io/did-spec/) spec from the [W3C Credentials Community Group](https://w3c-ccg.github.io).

The DID method relies on the [ethr-did-registry](https://github.com/uport-project/ethr-did-registry).

## DID method

To encode a DID for an Ethereum address, simply prepend `did:ethr:`

eg:

`did:ethr:0xf3beac30c498d9e26865f34fcaa57dbb935b0d74`

## Configuration

```js
import EthrDid from 'ethr-did'


```


## Create DID

Creating a DID is just creating an ethereum a
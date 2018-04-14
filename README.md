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
import EthrDID from 'ethr-did'

// Assume web3 object is configured either manually or injected using metamask

const ethrDid = new EthrDID({web3, address: web3.eth.defaultAccount})
```

## Create ethr DID

Creating an ethr DID is just creating an ethereum account. This library assumes that is done using the built in web3 provider already.

## Change owner of ethr DID

You can change the owner of an ethr DID. This is useful in particular if you are changing identity provider and want to continue to use the same identity.

This creates an Ethereum Transaction so your current owner account needs sufficent gas to be able to update it.

```js
await ethrDid.changeOwner(web3.eth.accounts[2])
```

## Add delegate signer

You can temporarily add a delegate signer to your DID. This is an address that can sign JWT's on your behalf. By adding an `expiresIn` value it will automatically expire after a certain time. It will by default expire after 1 day.

You can add different delegate types. The two types currently supported by [did-jwt](https://github.com/uport-project/did-jwt).

- `Secp256k1VerificationKey2018` *Default* for signing general purpose JWTs
- `Secp256k1SignatureAuthentication2018` A signer who is able to interactively authenticate as the DID's owner (log in)

This is useful if you want to give a dapp permission to sign on your behalf.

This creates an Ethereum Transaction so your current owner account needs sufficent gas to be able to update it.

```js
await ethrDid.addDelegate(web3.eth.accounts[3])

// Override defaults
await ethrDid.addDelegate(web3.eth.accounts[3], {expiresIn: 360, delegateType: 'Secp256k1SignatureAuthentication2018'})
```
## Set public attributes

You can set various public attributes to your DID using `setAttribute(key, value, exp)`. These are not directly queriable within smart contracts. But they let you publish information to your DID document, such as public encryption keys etc.

By adding an `expiresIn` value it will automatically expire after a certain time. It will by default expire after 1 day.

You can add different delegate types. The two types currently supported by [did-jwt](https://github.com/uport-project/did-jwt).

- `Secp256k1VerificationKey2018` *Default* for signing general purpose JWTs
- `Secp256k1SignatureAuthentication2018` A signer who is able to interactively authenticate as the DID's owner (log in)

This is useful if you want to give a dapp permission to sign on your behalf.

This creates an Ethereum Transaction so your current owner account needs sufficent gas to be able to update it.

```js
await ethrDid.setAttribute('did/publicKey/Ed25519VerificationKey2018/publicKeyBase64', 'Arl8MN52fwhM4wgBaO4pMFO6M7I11xFqMmPSnxRQk2tx', 31104000)
await ethrDid.setAttribute('did/publicKey/Ed25519VerificationKey2018/publicKeyBase64', Buffer.from('Arl8MN52fwhM4wgBaO4pMFO6M7I11xFqMmPSnxRQk2tx', 'base64'), 31104000)
await ethrDid.setAttribute('did/service/HubService', 'https://hubs.uport.me', 10)

```


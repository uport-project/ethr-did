---
title: "Getting Started"
index: 1
category: "ethr-did"
type: "guide"
source: "https://github.com/uport-project/ethr-did/blob/develop/docs/guides/index.md"
---

# Getting Started

## Construct a New Identity

### Create Ethr-DID

Creating an Ethr-DID is analogous to creating an Ethereum account, which is an address on the Ethereum blockchain controlled by a key pair. Your Ethr-DID will be your key pair.

We provide a convenient method to easily create one `EthrDID.createKeyPair()` which returns an object containing an Ethereum address and private key.

```js
const keypair = EthrDID.createKeyPair()
// Save keypair somewhere safe

const ethrDid = new EthrDID({...keypair, provider})
```

#### Use Existing Web3 Provider

If you use a built-in web3 provider like metamask you can use one of your metamask addresses as your identity.

```js
const ethrDid = new EthrDID({provider: web3.currentProvider, address: web3.eth.defaultAccount})
```

Unfortunately, web3 providers are not directly able to sign data in a way that is compliant with the JWT-ES256K standard. This is a requirement for exchanging verifiable off-chain data, so you will need to add a key pair as a signing delegate to be able to sign JWT's.

You can quickly add one like this:

```js
await ethrDid.createSigningDelegate() // Adds a signing delegate valid for 1 day
```

See section on adding delegates below.

**Note when using `HttpProvider` from `web3.js v1.0.0`:** There is an [issue](https://github.com/ethereum/web3.js/issues/1119) where the `sendAsync` function is undefined. In order to avoid errors resulting from this, please configure `EthrDID` using a different HTTP provider such as the one from `ethjs`:

```js
import HttpProvider from 'ethjs-provider-http'
const provider = new HttpProvider('http://localhost:8545')
const ethrDid = new EthrDID({provider, address, registry})
```

or manually assign `sendAsync` before creating an instance of the `web3` provider.

```js
import Web3 from 'web3'
Web3.providers.HttpProvider.prototype.sendAsync = Web3.providers.HttpProvider.prototype.send
const provider = new Web3.providers.HttpProvider('http://localhost:8545')
const ethrDid = new EthrDID({provider, address, registry})
```


#### Ethereum Web3 Wallet Developers

You can easily add support for signing yourself by implementing a signer function with a clean GUI. See [DID-JWT Signer Functions](https://github.com/uport-project/did-jwt#signer-functions).

The signer function can be passed in as the signer option to the `EthrDID` constructor:

```js
const ethrDid = new EthrDID({provider, address: web3.eth.defaultAccount, signer: wallet.jwtSigner})
```

## Exchange Verifiable Data

### Signing a JWT

A JWT is a JSON object that is signed so it can be verified as being created by a given DID.

A JWT looks like this:

`eyJ0eXAiOiJKV1QiLCJhbGciOiJFUzI1NksifQ.eyJpc3MiOiJkaWQ6dXBvcnQ6Mm5RdGlRRzZDZ20xR1lUQmFhS0Fncjc2dVk3aVNleFVrcVgiLCJpYXQiOjE0ODUzMjExMzMsInJlcXVlc3RlZCI6WyJuYW1lIiwicGhvbmUiXX0.1hyeUGRBb-cgvjD5KKbpVJBF4TfDjYxrI8SWRJ-GyrJrNLAxt4MutKMFQyF1k_YkxbVozGJ_4XmgZqNaW4OvCw`

Use any JSON compatible Javascript Object as a payload to sign.

```js
const helloJWT = await ethrDid.signJWT({hello: 'world'})

// A uPort compatible verification
const verification = await ethrDid.signJWT({claims: {name: 'Joe Lubin'}})
```

### Verifying a JWT

You can easily verify a JWT using `verifyJWT()`. When a JWT is verified, the signature of the public key is compared to the known issuer of the DID. If the signature matches the time it was issued and expiration times are checked for validity too.

An unverified JWT will resemble:

```
{ header: { typ: 'JWT', alg: 'ES256K' },
  payload:
   { iat: 1525927517,
     aud: 'did:uport:2osnfJ4Wy7LBAm2nPBXire1WfQn75RrV6Ts',
     exp: 1557463421,
     name: 'uPort Developer',
     iss: 'did:uport:2osnfJ4Wy7LBAm2nPBXire1WfQn75RrV6Ts' },
  signature: 'R7owbvNZoL4ti5ec-Kpktb0datw9Y-FshHsF5R7cXuKaiGlQz1dcOOXbXTOb-wg7-30CDfchFERR6Yc8F61ymw',
  data: 'eyJ0eXAiOiJKV1QiLCJhbGciOiJFUzI1NksifQ.eyJpYXQiOjE1MjU5Mjc1MTcsImF1ZCI6ImRpZDp1cG9ydDoyb3NuZko0V3k3TEJBbTJuUEJYaXJlMVdmUW43NVJyVjZUcyIsImV4cCI6MTU1NzQ2MzQyMSwibmFtZSI6InVQb3J0IERldmVsb3BlciIsImlzcyI6ImRpZDp1cG9ydDoyb3NuZko0V3k3TEJBbTJuUEJYaXJlMVdmUW43NVJyVjZUcyJ9' }
```

The `verifyJWT` function will take the above encoded JWT and validate it:

```js
const jwt = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJFUzI1NksifQ.eyJpYXQiOjE1MzE4Mjk5NzUsImF1ZCI6ImRpZDpldGhyOltvYmplY3QgT2JqZWN0XSIsImV4cCI6MTk1NzQ2MzQyMSwibmFtZSI6InVQb3J0IERldmVsb3BlciIsImlzcyI6ImRpZDpldGhyOltvYmplY3QgT2JqZWN0XSJ9.Mralpbz1Lo7DRsrWX7EYvtKDr8NAJWnf0Mgt4y8Eyu-WDNEHmZFwsTw_vG09zYGCM38RHEPeRTftRIYL__WMPg'

const {payload, issuer} = ethrDid.verifyJWT(jwt)
// payload contains the JavaScript object that was signed together with a few JWT specific attributes
console.log(`${payload}`)

// Issuer contains the DID of the signing identity
console.log(issuer)

```

Its verified output looks like:

```
{ payload:
   { iat: 1525927517,
     aud: 'did:uport:2osnfJ4Wy7LBAm2nPBXire1WfQn75RrV6Ts',
     exp: 1557463421,
     name: 'uPort Developer',
     iss: 'did:uport:2osnfJ4Wy7LBAm2nPBXire1WfQn75RrV6Ts' },
  doc:
   { '@context': 'https://w3id.org/did/v1',
     id: 'did:uport:2osnfJ4Wy7LBAm2nPBXire1WfQn75RrV6Ts',
     publicKey: [ [Object] ],
     uportProfile:
      { '@context': 'http://schema.org',
        '@type': 'App',
        name: 'Uport Developer Splash Demo',
        description: 'This app demonstrates basic login functionality',
        url: 'https://developer.uport.me' } },
  issuer: 'did:uport:2osnfJ4Wy7LBAm2nPBXire1WfQn75RrV6Ts',
  signer:
   { id: 'did:uport:2osnfJ4Wy7LBAm2nPBXire1WfQn75RrV6Ts#keys-1',
     type: 'EcdsaPublicKeySecp256k1',
     owner: 'did:uport:2osnfJ4Wy7LBAm2nPBXire1WfQn75RrV6Ts',
     publicKeyHex: 04c74d8a9154bbf48ce4b259b703c420e10aba42d03fa592ccf9dea60c83cd9ca81d3e08b859d4dc5a6dee30da2600e50ace688201b6f5a1e0938d135ec4b442ad' },
  jwt: 'eyJ0eXAiOiJKV1QiLCJhbGciOiJFUzI1NksifQ.eyJpYXQiOjE1MjU5Mjc1MTcsImF1ZCI6ImRpZDp1cG9ydDoyb3NuZko0V3k3TEJBbTJuUEJYaXJlMVdmUW43NVJyVjZUcyIsImV4cCI6MTU1NzQ2MzQyMSwibmFtZSI6InVQb3J0IERldmVsb3BlciIsImlzcyI6ImRpZDp1cG9ydDoyb3NuZko0V3k3TEJBbTJuUEJYaXJlMVdmUW43NVJyVjZUcyJ9.R7owbvNZoL4ti5ec-Kpktb0datw9Y-FshHsF5R7cXuKaiGlQz1dcOOXbXTOb-wg7-30CDfchFERR6Yc8F61ymw' }
```

A consuming app can use [did-jwt](https://github.com/uport-project/did-jwt) for verifying JWTs.


```js
import { verifyJWT } from 'did-jwt'

// did-jwt is agnostic about did methods so you need to register the 'ethr-did-resolver' first
require('ethr-did-resolver')()

const {payload, issuer} = await verifyJWT(helloJWT)

```

## Manage Keys

The Ethr-DID supports general key management that can be used to change ownership of keys, delegate signing rights temporarily to another account, and publish information about the identity in its DID document.

Currently, the following public key types are supported:
- `Secp256k1SignatureVerificationKey2018`
  - with `publicKeyHex` encoding and `ES256K`, `ES256K-R` algorithm's.
- `Secp256k1VerificationKey2018` is also supported1
  - with `publicKeyHex` encoding and `ES256K`, `ES256K-R` algorithm's.
  - or with `ethereumAddress` encoding but only with the `ES256K-R` algorithm.

Private keys (signing keys), also used for account recovery are hex encoded using [`secp256k1`](https://en.bitcoin.it/wiki/Secp256k1).


### The Concept of Identity Ownership

By default, an identity address is owned by itself. An identity owner is an address that is able to make and publish changes to the identity. As this is a very important function, you could change the ownership to use a smart contract based address implementing recovery or multi-sig at some point in the future.

Smart contracts are not able to sign, so you would also need to add a key pair based address as a signing delegate.

Most web3 providers also don't allow users to sign data that is compatible with JWT standards, which means that you would have to add a separate delegate key that you can use to sign JWTs on your behalf.

All the following functions assume that the passed in web3 provider can sign Ethereum transactions on behalf of the identity owner.

### Changing an Owner

You can change the owner of an Ethr-DID. This is useful in particular if you are changing an identity provider and want to continue to use the same identity.

This creates an Ethereum transaction, which will also broadcast a DIDOwnerChanged event. Make sure that the current account owner has sufficient gas to be able to update it.

```js
await ethrDid.changeOwner(web3.eth.accounts[2])
```

### Adding a Delegate Signer

You can temporarily add a delegate signer to your DID. This is an address that can sign JWTs on your behalf. By adding an `expiresIn` value, it will automatically expire after a certain time. It will by default expire after a day.

You can add different delegate types. The two types currently supported by [DID-JWT](https://github.com/uport-project/did-jwt) are:

- `veriKey` Which adds a `Secp256k1VerificationKey2018` (*Default* for signing general purpose JWTs)
- `sigAuth` Which adds a `Secp256k1SignatureAuthentication2018` signer who is able to interactively authenticate as the DID's owner (log in)

This is useful if you want to give a dApp the permission to sign on your behalf.

This creates an Ethereum transaction, so your current owner account needs sufficient gas to be able to update it.

```js
await ethrDid.addDelegate(web3.eth.accounts[3])

// Override defaults
await ethrDid.addDelegate(web3.eth.accounts[3], {expiresIn: 360, delegateType: 'sigAuth'})
```

There also exists a convenience function that creates a new delegate key pair, configures a signer with it and finally calls the above `addDelegate()` function.

```js
const keypair = await ethrDid.createSigningDelegate('sigAuth', 360)
```

The key pair object contains an `address` and `privateKey` attribute. Unless the key is just added temporarily, store it somewhere safe.

## Set Public Attributes

You can set various public attributes to your DID using `setAttribute(key, value, expiresIn)`. These cannot be queried within smart contracts, but they let you publish information to your DID document such as public encryption keys.

The following attribute `key` formats are currently support:

- `did/pub/(Secp256k1|Rsa|Ed25519)/(veriKey|sigAuth)/(hex|base64)` for adding a public key
- `did/svc/[ServiceName]` for adding a service

By adding an `expiresIn` value, it will automatically expire after a certain time. By default, it will expire after a day.

```js
await ethrDid.setAttribute('did/pub/Ed25519/veriKey/base64', 'Arl8MN52fwhM4wgBaO4pMFO6M7I11xFqMmPSnxRQk2tx', 31104000)
await ethrDid.setAttribute('did/pub/Ed25519/veriKey/base64', Buffer.from('Arl8MN52fwhM4wgBaO4pMFO6M7I11xFqMmPSnxRQk2tx', 'base64'), 31104000)
await ethrDid.setAttribute('did/svc/HubService', 'https://hubs.uport.me', 10)

```

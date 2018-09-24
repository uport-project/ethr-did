Ethr-DID
========

A Scalable Identity Method for Ethereum Addresses
-------------------------------------------------

uPort is a self-sovereign digital identity platform---anchored on the Ethereum blockchain. The uPort technology primarily consists of smart contracts, developer libraries, and a mobile app. uPort identities are fully owned and controlled by the creator---independent of centralized third-parties for creation, control or validation. For more information visit the overview page.

Using the Ethr-DID library, you can:

-   Create and manage keys for DID identities

-   Sign JSON Web Tokens

-   Allow third parties to sign on a key's behalf

-   Facilitate public key resolution for off-chain and on-chain authentication

The Ethr-DID library conforms to [ERC-1056](https://github.com/ethereum/EIPs/issues/1056) and supports the proposed Decentralized Identifiers spec from the W3C Credentials Community Group. These allow for Ethereum addresses to be used as fully self-managed Decentralized Identifiers (DIDs), as a result, you can easily create and manage keys for these identities. This library also allows you to sign standard compliant JSON Web Tokens (JWTs) that can be consumed using the DID-JWT library.

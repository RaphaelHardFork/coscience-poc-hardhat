# Data architecture

## Architecture

Need owner auth functions
![architecture](./architecture.png)

## Comment / Review [NFT]

- Author (address) = owner
- Date (timestamp) = TX
- title (maybe automatically generated)
- content => hashedContent (bytes)
- on [address(smart contract Article ou Review ou Comment) + id]
- replyTo (id)
- metrics (nb):
  - upVote
  - downVote

### Content metadata IPFS

- hashedContent (bytes)
- content (text)
- on article CID = QmRQWrE18iega4Ka89W6MorKYDaSR9WPLH1iL6ngERWwjP
- on paragraph CID (if possible, see IPLD) QmRQWrE18iega4Ka89W6MorKYDaSR9WPLH1iL6ngERWwjP/2

## Article [NFT]

- Author (address) = owner
- Date (timestamp) = TX
- title (string)
- Co author (address)
- content => hashedContent (bytes)
- nb paragraph  
  OR
- list of hashedParagraph
- metrics (nb):
  - need revision
  - reach standard
- add comment by modify the token (via function)

### use a ERC1155?

One article have multiple Review/Comment NFT

### Content metadata IPFS

- hashedContent (bytes)
- content (text)
- one CID for each paragraph?

## Centralized data (on IPFS maybe)

- WhiteList of wallets (those who can publish) (mapping of wallet made by an admin)

User register => User connect (token) => wallet (verification) => on whitelist (function via express)

Wallets linked to:

- author name
- bio (media, ...)
- email
- laboratory
- avatar
- metrics
- status (young - senior)

---

# Dapp architecture

## Pages

- Accueil
-

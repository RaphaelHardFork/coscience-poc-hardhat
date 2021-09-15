<p align="center">
<img src='./Coscience_logo.png' alt='logo'/>
</p>

<h3 align="center">Coscience</h3>

---

The collective science platform

# CoScience Hardhat backend

[Link to dApp](https://co-science-dapp.netlify.app/)  
[Link to dApp Github](https://github.com/RaphaelHardFork/coscience-poc-dapp)

## 🧐 About

A Dapp project for a decentralized scientifics Governance and a Science resources accessibility.

## Architecture

![architecture](./architecture.png)

## Futur improvment

- add **tags in bytes** like ACCESS_CONTROL to create category for articles, ...
- Transform **arrays** in Articles & Reviews struct into **mappings**

## Contracts

### 🚀 Deployment

users, articles, reviews, comments, (NFT post), governance, (Users post)

### Contracts size

| Contract Name | Size (Kb) |
| ------------- | --------- |
| Address       | 0.08      |
| Articles      | 20.91     |
| Comments      | 18.86     |
| Counters      | 0.08      |
| ERC721        | 8.95      |
| Governance    | 14.68     |
| Reviews       | 18.19     |
| Strings       | 0.08      |
| Users         | 8.75      |

### Gas reporting

From the pluggin **gasReporter**  
| Solc version: 0.8.7 | Optimizer enabled: false | Runs: 200 | Block limit: 12450000 gas |
| ------------------- | ------------------------ | --------- | ------------------------- |

| Contract   | Method              | Min    | Max    | Avg    | # calls |
| ---------- | ------------------- | ------ | ------ | ------ | ------- |
| Articles   | banArticle          | -      | -      | 55750  | 5       |
| Articles   | publish             | 272376 | 451082 | 370324 | 70      |
| Articles   | setContracts        | 75156  | 75180  | 75178  | 119     |
| Articles   | voteImportance      | 51958  | 84080  | 77656  | 5       |
| Articles   | voteValidity        | 52047  | 84169  | 77745  | 5       |
| Comments   | banPost             | -      | -      | 55728  | 5       |
| Comments   | post                | 343458 | 349167 | 347504 | 48      |
| Comments   | vote                | -      | -      | 83176  | 5       |
| Governance | askToRecoverAccount | -      | -      | 35224  | 3       |
| Governance | voteToAcceptUser    | 59902  | 89118  | 73451  | 157     |
| Governance | voteToBanArticle    | 77617  | 94717  | 82660  | 23      |
| Governance | voteToBanComment    | 77527  | 94627  | 82568  | 23      |
| Governance | voteToBanReview     | 65167  | 94677  | 80959  | 23      |
| Governance | voteToBanUser       | 39715  | 89183  | 74119  | 27      |
| Governance | voteToRecover       | 71006  | 102684 | 79613  | 23      |
| Reviews    | banPost             | -      | -      | 38650  | 4       |
| Reviews    | post                | 294923 | 323523 | 322280 | 46      |
| Reviews    | vote                | 52051  | 84173  | 79584  | 7       |
| Users      | acceptUser          | 35995  | 53095  | 43161  | 301     |
| Users      | addWallet           | -      | -      | 76605  | 12      |
| Users      | banUser             | -      | -      | 15743  | 5       |
| Users      | editProfile         | -      | -      | 37658  | 3       |
| Users      | recoverAccount      | -      | -      | 78185  | 7       |
| Users      | register            | 187461 | 294295 | 200651 | 360     |
| Users      | setContracts        | 46744  | 46756  | 46755  | 63      |

| Deployments |         |         |         | % of limit |
| ----------- | ------- | ------- | ------- | ---------- |
| Articles    | 4733504 | 4733516 | 4733515 | 38 %       |
| Comments    | 4329841 | 4329865 | 4329862 | 34.8 %     |
| Governance  | 3385297 | 3385321 | 3385317 | 27.2 %     |
| Reviews     | 4156645 | 4156669 | 4156667 | 33.4 %     |
| Users       | -       | -       | 2022583 | 16.2 %     |

### Version 0.0

Contract with no size optimization

```js
{
  "Users": {
    "rinkeby": { "address": "0xB53a11f8f9Dcb5379Dd3fE7AD1649727b18Ba491" }
  },
  "Articles": {
    "rinkeby": { "address": "0xc4D31789081B2EB0f1e65A3Cdf87AF17f1408817" }
  },
  "Reviews": {
    "rinkeby": { "address": "0xd17ffCa14121cbb08d8a671751b847287C31B4D1" }
  },
  "Comments": {
    "rinkeby": { "address": "0x175bAeF1584b9CBAc909111668ed769937443F81" }
  }
}
```

### Version 0.1

Token URI removed  
CID stored as string

```js
{
  "Users": {
    "rinkeby": { "address": "0x2DBc0235e6565c70f81Aa7F06BE51a57dad086B4" }
  },
  "Articles": {
    "rinkeby": { "address": "0xFA726c39CeB254F762C6b52CB9921f72aB0a20Dd" }
  },
  "Reviews": {
    "rinkeby": { "address": "0x7A2f775EAcA55FA6360618253CC8957Cd8501cD0" }
  },
  "Comments": {
    "rinkeby": { "address": "0x77943c71CF2d1da0E1678ac09581A5B149eA9454" }
  }
}
```

### Version 0.2

Governance added

```js
{
  "Users": {
    "rinkeby": { "address": "0x2c48E3F532786744b9cceB935c93e7859298adDe" },
    "goerli": { "address": "0x2c48E3F532786744b9cceB935c93e7859298adDe" },
    "bscTestnet": { "address": "0x2c48E3F532786744b9cceB935c93e7859298adDe" },
    "polygonTestnet": {
      "address": "0x2c48E3F532786744b9cceB935c93e7859298adDe"
    }
  },
  "Articles": {
    "rinkeby": { "address": "0x20B05d0Dfc12A4C71b55AfC14eCC5C452172c25b" }
  },
  "Reviews": {
    "rinkeby": { "address": "0xeAD88fFeee136e6a5EE7bdD5bb3007E424258019" }
  },
  "Comments": {
    "rinkeby": { "address": "0x5DF53542eC8701f8cd6e23159305952ce394BDAE" }
  },
  "Governance": {
    "rinkeby": { "address": "0x3119C752010C65D0D1CC7086052d9Be13707fF17" }
  }
}
```

### Last version

```js
{
  "Users": {
    "rinkeby": { "address": "0xCB92fef906e1dcaE39d930582A9cd2C3236A5dD9" },
    "goerli": { "address": "0xCB92fef906e1dcaE39d930582A9cd2C3236A5dD9" },
    "bscTestnet": { "address": "0xCB92fef906e1dcaE39d930582A9cd2C3236A5dD9" },
    "polygonTestnet": {
      "address": "0xCB92fef906e1dcaE39d930582A9cd2C3236A5dD9"
    },
    "kovan": { "address": "0xCB92fef906e1dcaE39d930582A9cd2C3236A5dD9" }
  },
  "Articles": {
    "rinkeby": { "address": "0xFEF1b4566D765A451078dd2D833e3e9b1319A95D" },
    "goerli": { "address": "0xFEF1b4566D765A451078dd2D833e3e9b1319A95D" },
    "kovan": { "address": "0xFEF1b4566D765A451078dd2D833e3e9b1319A95D" },
    "bscTestnet": { "address": "0xFEF1b4566D765A451078dd2D833e3e9b1319A95D" },
    "polygonTestnet": {
      "address": "0xFEF1b4566D765A451078dd2D833e3e9b1319A95D"
    }
  },
  "Reviews": {
    "rinkeby": { "address": "0xb54e636E4e426c813486348B2caa8d8374BA812A" },
    "goerli": { "address": "0xb54e636E4e426c813486348B2caa8d8374BA812A" },
    "kovan": { "address": "0xb54e636E4e426c813486348B2caa8d8374BA812A" },
    "bscTestnet": { "address": "0xb54e636E4e426c813486348B2caa8d8374BA812A" },
    "polygonTestnet": {
      "address": "0xb54e636E4e426c813486348B2caa8d8374BA812A"
    }
  },
  "Comments": {
    "rinkeby": { "address": "0xa72576FC292d9BD9Cddf9170a63aB221a62ae6d4" },
    "goerli": { "address": "0xa72576FC292d9BD9Cddf9170a63aB221a62ae6d4" },
    "kovan": { "address": "0xa72576FC292d9BD9Cddf9170a63aB221a62ae6d4" },
    "bscTestnet": { "address": "0xa72576FC292d9BD9Cddf9170a63aB221a62ae6d4" },
    "polygonTestnet": {
      "address": "0xa72576FC292d9BD9Cddf9170a63aB221a62ae6d4"
    }
  },
  "Governance": {
    "rinkeby": { "address": "0x99504699E5ee7f6C6259cf4D3F3FDc9C7E934BDA" },
    "goerli": { "address": "0x99504699E5ee7f6C6259cf4D3F3FDc9C7E934BDA" },
    "kovan": { "address": "0x99504699E5ee7f6C6259cf4D3F3FDc9C7E934BDA" },
    "bscTestnet": { "address": "0x99504699E5ee7f6C6259cf4D3F3FDc9C7E934BDA" },
    "polygonTestnet": {
      "address": "0x99504699E5ee7f6C6259cf4D3F3FDc9C7E934BDA"
    }
  }
}
```

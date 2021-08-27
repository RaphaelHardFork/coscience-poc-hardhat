// import { BigNumber } from 'ethers'

// UTILS FILE
const CID = require('cids')
const { BigNumber } = require('ethers')

// ARTICLES.SOL
// Pure function to create a JS object of the article list
const jsArticleList = async (articles, listOfId) => {
  const articleList = []
  let tab = []
  if (listOfId === undefined) {
    const nb = await articles.nbOfArticles()
    for (let i = 1; i <= nb; i++) {
      tab.push(i)
    }
  } else {
    tab = listOfId
  }

  for (const i of tab) {
    const a = await articles.articleInfo(i)
    articleList.push({
      id: a.id.toString(),
      author: a.author,
      coAuthor: a.coAuthor,
      contentBanned: a.contentBanned,
      abstractCID: a.abstractCID,
      contentCID: a.contentCID,
      comments: a.comments,
      reviews: a.reviews,
    })
  }
  return articleList
}

const userArticlesIds = async (articles, userAddress) => {
  const userArticlesBalance = await articles.balanceOf(userAddress)
  const userArticlesList = []
  for (let i = 0; i < userArticlesBalance.toNumber(); i++) {
    const id = await articles.tokenOfOwnerByIndex(userAddress, i) // ERC721Enumerable.sol
    userArticlesList.push(id.toNumber())
  }
  return userArticlesList // [2,6,8,10]
}

// Transform CID
const cidToUints = (cid) => {
  const cidObj = new CID(cid)
  const hexString = cidObj.toString('base16')
  const demiLength = Math.floor(hexString.length / 2)
  const demiHexString = [
    hexString.slice(0, demiLength + 1),
    hexString.slice(-demiLength),
  ]
  const demiBigNumber = demiHexString.map((demi) => {
    return BigNumber.from('0x' + demi)
  })

  return demiBigNumber
}

const uintsToCid = (uints) => {
  const demiHexString = uints.map((demi) => {
    const str = demi.toString()
    const demiTrimmed = str.slice(0, 2)
    return demiTrimmed
  })
  const hexString = demiHexString.join('')
  return new CID(hexString).toString('base32')
}

const uints = cidToUints(
  'bafybeigdyrzt5sfp7udm7hu76uh7y26nf3efuylqabf3oclgtqy55fbzdi'
)
const cid = uintsToCid(uints)

console.log(uints)
console.log(cid)

# LoanProtocol

This app is an Ethereum smart contract for supplying or borrowing assets. The lending platform automatically evaluates the users’ borrowers and computes their **trustworthiness score** automatically considering their loan activity. The main goal is to **lower or remove the collateral** thanks to the trustworthiness score and make lending more accessible.

The **score** is based on 
  - ProfileScore + 
  - ActivityScore +
  - socialRecommendationScore +
  - LoanRiskScore
  
where *ProfileScore* is the Profile of users' borrowers, *ActivityScore* is the Financial Activity of users' borrowers, *SocialRecommendationScore* is a person who becomes a guarantee for users' borrowers, *LoanRiskScore* is the track record of users' borrowers in another loans.


### Installation
```
git clone git@github.com:ethereum-app/LoanProtocol.git
cd LoanProtocol/

// install dependencies
npm i

// launch local blockchain (9545 port)
truffle develop
truffle midgrate

// open another console
cd client/
npm i

// start the app on localhost:3000
npm start 
```

---
### Apply for a loan

Click on the "Borrow button" just below the navbar.

![borrower page](https://drive.google.com/uc?export=view&id=1t6DEcz2uzhvRZme2D6wHp1KIXoaBarCl)
---
### Upload your transactions (.csv file) directly on the blockchain

Click on "show popup" button to upload a file.

![borrower page](https://drive.google.com/uc?export=view&id=19nWdxRpRTJz9I8U7ha51NSJQsjZcWrXZ)
---
### Invest in someone's project

Click on the "Lend button" just below the navbar,

![borrower page](https://drive.google.com/uc?export=view&id=19VuNHhHd7erk2OsqFUq-zioTPxx8Impk)
---
### Recommend someone's project

This feature is not finished yet, you will be able to recommend someone's project by sending a small amount of ether to make a proof of your recommendation. If your recommended project is not scam, you will get back your amount with an interest.

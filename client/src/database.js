import IPFS from "ipfs";
import OrbitDB from "orbit-db";

/* DocStore is used to persist user profile
 * Feed is used to persist loan requests
 */


const dbManagement = {

    async createDb() {
        // Create IPFS instance
        const ipfsOptions = {repo: './ipfs',}
        const ipfs = await IPFS.create(ipfsOptions)

        // Create OrbitDB instance
        const orbitdb = await OrbitDB.createInstance(ipfs)
        console.log("instance created : " + orbitdb);

        const options = {
            // Give write access to ourselves
            accessController: {
                write: "*"
            }
        }

        // Create database instance
        const dbLoans = await orbitdb.feed('loan-requests', options)
        console.log(dbLoans.address.toString())

        return orbitdb;
      /*  // Creating an identity
        const Identities = require('orbit-db-identity-provider')
        const optionsId = {id: 'local-id'}
        const identity = await Identities.createIdentity(optionsId)
        await dbLoans.close()*/
    },

    async updateDb(orbitdb, publicUserKey, requestLoan) {

        const dbLoans = await orbitdb.feed('loan-requests')
        await dbLoans.load()

        const hash = await dbLoans.add(requestLoan)
        console.log("database updating...");
        const event = dbLoans.get(hash)
        console.log("get from database : " + JSON.stringify(event));

        await dbLoans.close()
    },

    async getLoanRequestsDb(orbitDb, publicUserKey) {

        const dbLoans = await orbitDb.feed('loan-requests')
        await dbLoans.load()

        return dbLoans.all;
    }
}

//     // defining a schema
//     const schema = new Schema({
//         models: {
//             loanRequest: {
//                 attributes: {
//                     projectName: { type: "string" },
//                     projectDescription: { type: "string" },
//                     requestedAmount: { type: "string"}
//                 },
//                 relationships: {
//                     user: { type: "hasOne", model: "user", inverse: "loanRequest" }
//                 }
//             },
//             user: {
//                 attributes: {
//                     name: { type: "string" },
//                     score: { type: "string" }
//                 },
//                 relationships: {
//                     loanRequest: { type: "hasOne", model: "loanRequest", inverse: "user" }
//                 }
//             }
//         }
//     });
//
// //defining a source
//     const memory = new MemorySource({ schema });
//
//
//     const user1 = {
//         type: "user",
//         id: "user1",
//         attributes: {
//             name: "Thomas",
//             score: "good"
//         }
//     };
//
//     const user2 = {
//         type: "user",
//         id: "user2",
//         attributes: {
//             name: "Michael",
//             score: "perfect"
//         }
//     };
//
//     const loanRequest1 = {
//         type: "loanRequest",
//         id: "loanRequest1",
//         attributes: {
//             projectName: "Project Name 1",
//             projectDescription: "Project description for a first project",
//             requestedAmount: "10"
//         }
//     }
//
//     const loanRequest2 = {
//         type: "loanRequest",
//         id: "loanRequest2",
//         attributes: {
//             projectName: "Project Name 2",
//             projectDescription: "Project description for a second project",
//             requestedAmount: "5"
//         }
//     };
//
//     await memory.update(t => [
//         t.addRecord(user1),
//         t.addRecord(user2),
//         t.addRecord(loanRequest1),
//         t.addRecord(loanRequest2)
//     ]);
//
//
// // testing
//
//     let users = await memory.query(q => q.findRecords("user").sort("name"));
//     let loanRequests = await memory.query(q => q.findRecords("loanRequest").sort("projectName"));
//
//     console.log(users);
//     console.log(loanRequests);

export default dbManagement;

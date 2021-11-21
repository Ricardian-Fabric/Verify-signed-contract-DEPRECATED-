import { ipfsCat, IPFSCONFIG, Status, parseContract, } from "../src";

const CIDForFulfilled = "bafybeiaef5vqzlzmnqayunyo63gh56n72mc37r73pr7f2a5mu6ikasmojm";
const CIDForAcceptable = "bafybeifklnfbvb36xt7or6cctsfs6c7llg66qqmlncajt4ojh4rj4ksxga";

//TODO: maybe I get the parent from the smart contract, if I add web3 into this
const parent = "https://bafybeifklnfbvb36xt7or6cctsfs6c7llg66qqmlncajt4ojh4rj4ksxga.ipfs.infura-ipfs.io/";

test("fetches the contract using the content identifier", async () => {
    const ipfsDataOptions = await ipfsCat(CIDForFulfilled, IPFSCONFIG);
    expect(ipfsDataOptions.status).toBe(Status.success);
})

test("parses the fetched contract", async () => {
    const ipfsDataOptions = await ipfsCat(CIDForFulfilled, IPFSCONFIG);
    const contractOptions = await parseContract(ipfsDataOptions.data);
    expect(contractOptions.status).toBe(Status.success);
});

test("parses the fetched contract and throws wrong contract type", async () => {
    const ipfsDataOptions = await ipfsCat(CIDForAcceptable, IPFSCONFIG);
    const contractOptions = await parseContract(ipfsDataOptions.data);
    expect(contractOptions.status).toBe(Status.failure);
    expect(contractOptions.error).toBe("Invalid contract type");
});

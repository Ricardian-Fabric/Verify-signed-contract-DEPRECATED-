import { ipfsCat, IPFSCONFIG, Status, parseContract, } from "../src";
import { matchParent, verifyParticipant } from "../src/verifyProofs";

//TODO: perma pin the test contracts so they don't disappear
const CIDForFulfilled = "bafybeiavobnbjf2czm7k4eenmtiloquualjn6n6ts32y2pgiacy3streaa";

const CIDForAcceptable = "bafybeigtrw7ztt7ew6m5nnq773pjgdrogmqqgnrst6izlmn7p33vinl2ke";

// NOTE: Can get the parent from the smart contract with web3 if smart contract is not NONE, but needs infura provider
const parent1 = "https://bafybeifklnfbvb36xt7or6cctsfs6c7llg66qqmlncajt4ojh4rj4ksxga.ipfs.infura-ipfs.io/";
const parent2 = "https://bafybeigtrw7ztt7ew6m5nnq773pjgdrogmqqgnrst6izlmn7p33vinl2ke.ipfs.infura-ipfs.io/"

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

test("matches the parent to verify the origin of the signed contract", async () => {
    const ipfsDataOptions = await ipfsCat(CIDForFulfilled, IPFSCONFIG);
    const contractOptions = await parseContract(ipfsDataOptions.data);

    expect(matchParent(parent1, contractOptions.data)).toBe(false);
    expect(matchParent(parent2, contractOptions.data)).toBe(true);
})

test("verifies the issuer and the participant signatures,returns the participant", async () => {
    const ipfsDataOptions = await ipfsCat("bafybeib2ne2jmvltaiozkf3hev7h2w7b7dyxgrcyomwt4q7fd262vg3wzy", IPFSCONFIG);
    const contractOptions = await parseContract(ipfsDataOptions.data);
    const participantOptions = await verifyParticipant(contractOptions.data);
    expect(participantOptions.status).toBe(Status.success);
})

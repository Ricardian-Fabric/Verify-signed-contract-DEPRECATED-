import { ipfsCat, IPFSCONFIG, Status, parseContract } from "../src";

const CID = "bafybeiaef5vqzlzmnqayunyo63gh56n72mc37r73pr7f2a5mu6ikasmojm";

test("fetches the contract using the content identifier", async () => {
    const ipfsDataOptions = await ipfsCat(CID, IPFSCONFIG);
    expect(ipfsDataOptions.status).toBe(Status.success);
})

test("parses the fetched html", async () => {
    const ipfsDataOptions = await ipfsCat(CID, IPFSCONFIG);
    const contractOptions = await parseContract(ipfsDataOptions.data);
    console.log(contractOptions);
    expect(contractOptions.status).toBe(Status.success);

});

import { CID } from "multiformats/cid";
import { create } from "ipfs-http-client";
import { concat as uint8ArrayConcat } from 'uint8arrays/concat'
import { toString as uint8ArrayToString } from 'uint8arrays/to-string'
import { DOMParser, XMLSerializer } from "@xmldom/xmldom";
/*
  @Dev: The functions that return Options might return Status.success or Status.failure
*/
export enum Status { success, failure };

/*
 @Dev: To handle errors, check for options.status
 To get the result of the function, use options.data
 To print the error message, use options.error
*/
export type Options<T> = { error: string, status: Status, data: T }

/*
  @Dev: The default ipfs configuration used by Ricardian Fabric
*/
export const IPFSCONFIG: IPFSConfig = {
    host: "ipfs.infura.io",
    port: 5001,
    protocol: "https",
};

export type IPFSConfig = { host: string, port: number, protocol: string }

/*


*/
export type Contract = {
    contracttype: string,
    version: string,
    created: string,
    expires: string,
    redirectto: string,
    parenturl: string,
    network: string,
    issuer: string,
    issuersignature: string,
    participant: string,
    participantsignature: string,
    smartcontract: string,
    erc20: string,
    selectedWallet: string,
    legalcontract: any
}


/*
 @Dev: Extract the CID from the path after Ricardian Fabric redirects.
 The CID will be appended as the last path in the url string.
 This function uses the browser API and returns options
*/
export function getCIDfromPath(): Options<string> {
    let options: Options<string> = { status: Status.success, error: "", data: "" }
    // I split the url paths at /
    const pathArrays = window.location.pathname.split("/");
    const lastIndex = pathArrays.length - 1;
    const CID = pathArrays[lastIndex];

    if (isCID(CID)) {
        options.data = CID;
    } else {
        options.error = "Invalid CID";
        options.status = Status.failure;
    }
    return options;
}

/*
    Check if the CID is valid
*/
function isCID(hash: any) {
    try {
        if (typeof hash === 'string') {
            return Boolean(CID.parse(hash))
        }

        if (hash instanceof Uint8Array) {
            return Boolean(CID.decode(hash))
        }

        return Boolean(CID.asCID(hash)) // eslint-disable-line no-new
    } catch (e) {
        return false
    }
}

/**
 * Collects all values from an (async) iterable into an array and returns it.
 *
 * @template T
 * @param {AsyncIterable<T>|Iterable<T>} source
 */
const all = async (source: any) => {
    const arr = []

    for await (const entry of source) {
        arr.push(entry)
    }

    return arr
}


/*
 @Dev: Use ipfsCat to fetch the content of the ricardian contract
 Pass in the CID and the configuration.
*/

export async function ipfsCat(CID: string, config: IPFSConfig): Promise<Options<string>> {
    const options: Options<string> = { status: Status.success, data: "", error: "" }
    try {
        const client = create(config);
        const data = uint8ArrayConcat(await all(client.cat(CID)))
        options.data = uint8ArrayToString(data);
    } catch (err: any) {
        options.error = err.message;
        options.status = Status.failure;
    }
    return options;
}

/*

@Dev: Parse the fetched contract to extract it's details
*/

export async function parseContract(html: string): Promise<Options<Contract>> {
    const options: Options<Contract> = { status: Status.success, data: null, error: "" }
    try {
        const doc: Document = new DOMParser().parseFromString(html, "text/html");

        const page: Element = doc.getElementById("page");
        if (page === null || page === undefined) {
            throw new Error("Invalid document.");
        }
        const display: Element = doc.getElementById("contract-display");
        const serializer = new XMLSerializer();
        let display_innerHTML = "";
        for (let i = 0; i < display.childNodes.length; i++) {
            const node = display.childNodes[i];
            display_innerHTML += serializer.serializeToString(node);
        }
        const contracttype = page.getAttribute("data-contracttype");

        if (contracttype !== "fulfilled") {
            throw new Error("Invalid contract type")
        }

        options.data = {
            contracttype: contracttype,
            version: page.getAttribute("data-version"),
            created: page.getAttribute("data-created"),
            expires: page.getAttribute("data-expires"),
            redirectto: page.getAttribute("data-redirectto"),
            parenturl: page.getAttribute("data-parenturl"),
            network: page.getAttribute("data-network"),
            issuer: page.getAttribute("data-issuer"),
            issuersignature: page.getAttribute("data-issuersignature"),
            participant: page.getAttribute("data-participant"),
            participantsignature: page.getAttribute("data-participantsignature"),
            smartcontract: page.getAttribute("data-smartcontract"),
            erc20: page.getAttribute("data-erc20"),
            selectedWallet: page.getAttribute("metamask"),
            legalcontract: display_innerHTML,
        }
        const scripts = doc.getElementsByTagName("script")
        if (scripts.length !== 0) {
            // This should be only used for fulfilled contracts
            throw new Error("Unknown scripts detected.")
        }
    } catch (err: any) {
        options.error = err.message;
        options.status = Status.failure;
    }
    return options;
}
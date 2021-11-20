import { CID } from "multiformats/cid";
import { create } from "ipfs-http-client";
import { concat as uint8ArrayConcat } from 'uint8arrays/concat'
import { toString as uint8ArrayToString } from 'uint8arrays/to-string'
import { DOMParser, XMLSerializer } from "xmldom";
/*
  @Dev: The functions that return Options might return Status.success or Status.failure
*/
export enum Status { success, failure };

/*
 @Dev: To handle errors, check for options.status
 To get the result of the function, use options.data
 To print the error message, use options.error
*/
export type Options = { error: string, status: Status, data: any }

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
 @Dev: Extract the CID from the path after Ricardian Fabric redirects.
 The CID will be appended as the last path in the url string.
 This function uses the browser API and returns options
*/
export function getCIDfromPath(): Options {
    let options: Options = { status: Status.success, error: "", data: "" }
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

export async function ipfsCat(CID: string, config: IPFSConfig): Promise<Options> {
    const options: Options = { status: Status.success, data: "", error: "" }
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

//TODO: maybe rename to verify contract and also pass in the parent to check for, to make sure this contract is not old, but the version the dev wants to use.
export async function parseContract(html: string): Promise<Options> {
    const options: Options = { status: Status.success, data: "", error: "" }
    try {
        const doc: Document = new DOMParser().parseFromString(html, "text/html");
        const body = doc.getElementsByTagName("body");
        if (body === null) {
            throw "Invalid document.";
        }

        for (const element of body) {
            console.log("element");
        }

        // console.log(page.dataset);
    } catch (err: any) {
        options.error = err.message;
        options.status = Status.failure;
    }
    return options;
}
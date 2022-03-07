import { CID } from "multiformats/cid";
import { create } from "ipfs-http-client";
import { concat as uint8ArrayConcat } from 'uint8arrays/concat'
import { toString as uint8ArrayToString } from 'uint8arrays/to-string'
import { DOMParser, XMLSerializer } from "@xmldom/xmldom";
import { recoverTypedSignature, SignTypedDataVersion } from "@metamask/eth-sig-util";
import Web3 from "web3";

import { toChecksumAddress } from "ethereumjs-util";
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

  @Dev: The following sanctions can be applied: OFEC,EU,UN or you can choose to block USA
*/
export enum BlockCountry {
    OFEC = "OFEC",
    EU = "EU",
    UN = "UN",
    BLOCKUSA = "BLOCKUSA"
}

/**
  @Dev: THe parsed ricardian contract contains the data defined in this type
  
    @param contracttype: is "fulfilled" in case of signed contracts
    @param version: is the ricardian fabric version
    @param signedon: is the date when the contract was signed
    @param created: is the date when the agreement was created
    @param expires: is the date the agreement can't be accepted after
    @param redirectto: is the url where the contract redirects after signing
    @param parenturl: is the url of the acceptable contract
    @param network: is the network number, here used as a string
    @param issuer: the address of the issuer
    @param issuersignature: the signature of the issuer
    @param participant: the address of the signer of the agreement
    @param participantsignature: the signature of the participant
    @param smartcontract: the address of the attached smart contract
    @param erc20: the details of the erc20 that gets added to the wallet
    @param legalcontract: the html content of the  agreement
    @param blockedAddresses: the addresses that are blocked from signing the agreement
    @param blockedCountries: the sanctions regulating the signing of the contract, for example: sancioned countries are blocked
        */
export type Contract = {
    contracttype: string,
    version: string,
    signedon: string;
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
    legalcontract: any,
    blockedAddresses: string[],
    blockedCountries: BlockCountry[]
}

type HashContent = {
    legalContract: string;
    createdDate: string;
    expires: string;
    redirectto: string;
    version: string;
    issuer: string;
    blockedCountries: BlockCountry[];
    blockedAddresses: string[];
    network: string;
    smartContract: string;
    ERC20: string;
};



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
 * 
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
        const erc20 = page.getAttribute("data-erc20");
        options.data = {
            contracttype: contracttype,
            version: page.getAttribute("data-version"),
            signedon: page.getAttribute("data-signedon"),
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
            erc20: erc20 === "null" ? null : erc20,
            legalcontract: display_innerHTML,
            blockedAddresses: JSON.parse(page.getAttribute("data-blockedaddresses")),
            blockedCountries: JSON.parse(page.getAttribute("data-blockedcountries"))

        }
        const scripts = doc.getElementsByTagName("script")
        if (scripts.length !== 0) {
            // This dependency should be only used for fulfilled contracts aka proofs of acceptance.
            // Those have no dependency.
            throw new Error("Unknown scripts detected.")
        }
    } catch (err: any) {
        options.error = err.message;
        options.status = Status.failure;
    }
    return options;
}


/** 
 * @Dev: Matches the parent variable to be one inside the contract.
 * This is used for validating the accepted contract's source is authentic,
 * since we always want to verify a specific acceptable contract's children.
 * 
 * @param parent corresponds to the URL string of the acceptable contract
 */
export function matchParent(parent: string, contract: Contract): boolean {
    if (contract.parenturl !== parent) {
        return false;
    }
    return true;
}


/**
 @Dev: Verifies the Participant's signature and returns it's address
 @param contract is the parsed contract
 */
export async function verifyParticipant(contract: Contract): Promise<Options<string>> {
    const options: Options<string> = { error: "", data: "", status: Status.success }

    try {
        const data = {
            legalContract: contract.legalcontract,
            createdDate: contract.created,
            expires: contract.expires,
            redirectto: contract.redirectto,
            version: contract.version,
            issuer: contract.issuer,
            blockedCountries: contract.blockedCountries,
            blockedAddresses: contract.blockedAddresses,
            network: contract.network,
            smartContract: contract.smartcontract,
            ERC20: contract.erc20
        }

        const hash = getHash(data);
        const msgParams = getmsgParams(contract.network, contract.smartcontract, hash);
        const recoveredIssuer = recoverTypedSignatures(msgParams, contract.issuersignature);
        if (!compareAddresses(recoveredIssuer, contract.issuer)) {
            throw new Error("Invalid issuer signature");
        }
        const recoveredParticipant = recoverTypedSignatures(msgParams, contract.participantsignature);
        if (!compareAddresses(recoveredParticipant, contract.participant)) {
            throw new Error("Invalid participant signature");
        }
        options.data = recoveredParticipant;
    } catch (err) {
        options.status = Status.failure;
        options.error = err.message;
    }
    return options;
}

/**
 Compares two addresses and returns true if they match
 @param compareAddress
 @param toAddress
*/

export function compareAddresses(compareAddress: string, toAddress: string): boolean {
    // The recovered is an object during runtime
    if (toChecksumAddress(compareAddress) === toChecksumAddress(toAddress)) {
        return true;
    } else {
        return false;
    }
}

function getmsgParams(
    networkId: string,
    smartContract: string,
    hash: string) {
    const doc = [{ name: "value", type: "string" }];
    const message = { value: hash };
    const msgParams = {
        domain: {
            chainId: networkId,
            name: "Ricardian Fabric",
            verifyingContract: smartContract,
            version: "1",
        },
        types: {
            EIP712Domain: [
                { name: "name", type: "string" },
                { name: "version", type: "string" },
                { name: "chainId", type: "uint256" },
                { name: "verifyingContract", type: "address" },
            ],
            doc,
        },
        primaryType: "doc",
        message,
    };
    return msgParams;
}

function recoverTypedSignatures(msgParams, signature) {

    const recovered = recoverTypedSignature({
        data: msgParams,
        signature: signature,
        version: SignTypedDataVersion.V3
    });
    return recovered;
}



function sha256(message): string {
    const web3 = new Web3();
    const encoded = web3.eth.abi.encodeParameters(["string"], [message]);
    const hash = Web3.utils.sha3(encoded);
    return hash;
}

function concatStrings(data: Array<string>) {
    let res = "";
    data.forEach((d) => {
        res += d;
    });
    return res;
}


function orderStringsForHashing(data: HashContent) {
    const blockedCountries = JSON.stringify(data.blockedCountries);
    const blockedAddresses = JSON.stringify(data.blockedAddresses)
    return concatStrings([
        data.legalContract,
        data.createdDate,
        data.expires,
        data.redirectto,
        data.version,
        data.issuer,
        blockedCountries,
        blockedAddresses,
        data.network,
        data.smartContract,
        data.ERC20
    ]);
}

function getHash(data: HashContent) {
    const ordered = orderStringsForHashing(data);
    return sha256(ordered);
}

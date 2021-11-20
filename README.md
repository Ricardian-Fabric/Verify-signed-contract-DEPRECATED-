# @ricadianfabric/verify-proofs

Verify-proofs is a typescript dependency used for verifying accepted ricardian contracts and it can be used with Ricardian Fabric. When a contract is accepted, the participants can choose to redirect to a url specified by the issuer, the issuer at the specified url can use this dependency to verify the result and then perform actions.



# Types

### Options and Status

    export enum Status { success, failure };
The status enum is used for signaling if an error was thrown inside a function.

    type Options = { error: string, status: Status, data: any }

A function that returns options handles errors inside.

When checking for errors use :

    if (options.status === Status.failure){}

To display the error, use 
    
    options.error

If the options contains 

    Status.success
    
access the result 

    options.data

### IpfsConfig

The ipfs configuration object is:

    type IPFSConfig = { host: string, port: number, protocol: string };

To access the built in configuration, import the constant variable:

    IPFSCONFIG

# Api

    function getCIDfromPath(): Options 

This function uses the browser API, and can be called from the Browser only. It will return the CID from the URL, if it exists.




    async function ipfsCat(CID: string, config: IPFSConfig): Promise<Options> 

Use ipfsCat to fetch the ricardian contract by CID. You should use the built in configuration object.


     async function parseContract(html: string): Promise<Options>

Parse the fetched ricardian contract and extract it's details. 

example:

    const ipfsDataOptions = await ipfsCat(CID, IPFSCONFIG);
    if(ipfsDataOptions.status === Status.failure){
        // log your error, or display on UI
        console.error(ipfsDataOptions.error);
        return;
    }
    const contractOptions = parseContract(ipfsDataOptions.data);

    if(contractOptions.status === Status.failure){
        console.error(contractOptions.error);
        return;
    }
    const parsedContract = contractOptions.data;


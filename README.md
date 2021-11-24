# @ricadianfabric/Verify-Signed-Contract

Verify-Sigined-Contract is a typescript dependency used for verifying accepted ricardian contracts and it can be used with Ricardian Fabric. When a contract is accepted, the participants can choose to redirect to a url specified by the issuer, the issuer at the specified url can use this dependency to verify the result and then perform actions.

This dependency works only from Ricardian Fabric 0.0.4 

# Install
The package is hosted only on github.
Add this to your package.json to grab the latest:

    "@ricardianfabric/verify-signed-contract": "git+https://github.com/StrawberryChocolateFudge/Verify-Signed-Contract.git"


# Example
You can find the example of how to use it in a DEFI front end here:
    
    https://github.com/StrawberryChocolateFudge/verify-contract-example


# Api

    function getCIDfromPath(): Options<string> 

This function uses the browser API, and can be called from the Browser only. It will return the CID from the URL, if it exists.


    async function ipfsCat(CID: string, config: IPFSConfig): Promise<Options<string>> 

Use ipfsCat to fetch the ricardian contract by CID. You should use the built in configuration object.


     async function parseContract(html: string): Promise<Options<Contract>>

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
    const parsedContract: Contract = contractOptions.data;

verify the contents of the fetched contract:

    async function verifyParticipant(contract: Contract): Promise<Options<string>>

verifyParticipant returns the address of the participant after it validates the signatures of both the issuer and the participant.

example usage, following the previous example:

    const participantOptions = await verifyParticipant(contractOptions.data);

make sure to check for errors:

    if(participantOptions.status === Status.failure){
        console.error(particiantOptions.error);
    }

get the address of the participant

    const participantAddress = participantOptions.data;

You can also compare addresses;

    function compareAddresses(compareAddress: string, toAddress: string): boolean



# Types

## Contract
   
    /*
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


## Options and Status

    export enum Status { success, failure };
The status enum is used for signaling if an error was thrown inside a function.

    type Options<T> = { error: string, status: Status, data: T }

A function that returns options handles errors inside.

When checking for errors use :

    if (options.status === Status.failure){}

To display the error, use 
    
    options.error

If the options contains 

    Status.success
    
access the result 

    options.data

## IpfsConfig

The ipfs configuration object is:

    type IPFSConfig = { host: string, port: number, protocol: string };

To access the built in configuration, import the constant variable:

    IPFSCONFIG


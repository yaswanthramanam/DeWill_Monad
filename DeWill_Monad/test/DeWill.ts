import {
    time,
    loadFixture,
} from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { expect } from 'chai';
import hre from 'hardhat';

interface Recipient {
    addr: string,
    firstName: string,
    lastName: string,
    primaryEmail: string,
    secondaryEmail: string,
    currency: Currency,
    country: Country,
    age: number,
    gender: Gender,
    percentage: number
}

interface Will{
    text: string;
    recipients: Recipient[];
}

enum Country {
    India,
    UnitedStates,
    UnitedKingdom,
    Japan,
    Canada,
    Australia,
    China,
    Russia,
    Switzerland,
    EU
}

enum Gender {
    Male,
    Female,
    Others
}
enum Currency {
    ETH,
    Sonic,
    Near,
    Electronium
}

describe("DeWill", function () {
    async function deployDeWill() {


        const [owner, otherAccount] = await hre.ethers.getSigners();

        const DeWill = await hre.ethers.getContractFactory("DeWill");
        const deWill = await DeWill.deploy();

        return { deWill, owner, otherAccount };
    }

    describe("Deployment", function () {
        it("Add recipients and check their availability: ", async function () {
            const { deWill, owner, otherAccount } = await loadFixture(deployDeWill);

            const recipients: Recipient[] = [
                {
                    addr: otherAccount.address.toString(),
                    firstName: "kill",
                    lastName: "abc",
                    primaryEmail: "qhsjqskqks@2d2el2.cnmc",
                    secondaryEmail: "shsjqs2ee2ekqks@2d2el2.cnmc",
                    currency: Currency.ETH,
                    country: Country.India,
                    age: 23,
                    gender: Gender.Male,
                    percentage: 100
                }
            ];

            let will: Will = {
                text: "", 
                recipients: []
            };
            
            will.recipients= recipients;
            will.text= "Sample";
            await deWill.addRecipients(will);
            console.log(await deWill.getRecipients());
            expect((await deWill.getRecipients()).length).to.equal(1);

            await deWill.setStaking(true);
            expect((await deWill.getStaking())).to.equal(true);

            await deWill.optOut();

            console.log(await deWill.getRecipients());

            expect((await deWill.getRecipients()).length).to.equal(0);

            expect((await deWill.getStaking())).to.equal(false);
        });
    });

});

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/access/Ownable.sol";
import "hardhat/console.sol";

contract DeWill is Ownable {
    mapping(Country => string) private countryToCurrency;

    mapping(address => Activity) private recentActivity;

    mapping(address => bool) private isStaking;

    mapping(address => Will) private inheritence;

    mapping(address => Request[]) private requests;

    address[] private keys;

    mapping(address => mapping(Currency => uint256)) private balance;

    mapping(address => bool) public isAdded;

    struct Activity {
        uint256 lastActivity;
        uint256 inactivityThreshold;
    }

    struct Request {
        string email;
        string code;
        uint256 percentage;
        string reason;
        uint256 timestamp;
    }

    struct Balance {
        Currency currency;
        uint256 balance;
    }

    struct Will {
        string text;
        Recipient[] recipients;
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
        Monad,
        Sonic,
        ETH,
        Near,
        Electroneum
    }

    struct Recipient {
        address addr;
        string firstName;
        string lastName;
        string primaryEmail;
        string secondaryEmail;
        Currency currency;
        Country country;
        uint age;
        Gender gender;
        uint256 percentage;
    }

    constructor() Ownable(msg.sender) {
        countryToCurrency[Country.India] = "INR";
        countryToCurrency[Country.UnitedStates] = "USD";
        countryToCurrency[Country.UnitedKingdom] = "GBP";
        countryToCurrency[Country.Japan] = "JPY";
        countryToCurrency[Country.Canada] = "CAD";
        countryToCurrency[Country.Australia] = "AUD";
        countryToCurrency[Country.China] = "CNY";
        countryToCurrency[Country.Russia] = "RUB";
        countryToCurrency[Country.Switzerland] = "CHF";
    }

    function optOut() external {
        delete inheritence[msg.sender];
        delete isStaking[msg.sender];
        removeKey(msg.sender);
        delete isAdded[msg.sender];
        delete recentActivity[msg.sender];
        delete requests[msg.sender];
        // Explicitly reset each currency balance to 0
        balance[msg.sender][Currency.ETH] = 0;
        balance[msg.sender][Currency.Sonic] = 0;
        balance[msg.sender][Currency.Near] = 0;
        balance[msg.sender][Currency.Electroneum] = 0;
        removeKey(msg.sender);
    }

    function getKeys() external view returns (address[] memory) {
        return keys;
    }

    function removeKey(address addr) internal {
        for (uint i = 0; i < keys.length; i++) {
            if (keys[i] == addr) {
                keys[i] = keys[keys.length - 1];
                keys.pop();
                return;
            }
        }
    }

    function addRequest(
        string memory _email,
        string memory _code,
        uint256 _percentage,
        string memory _reason,
        uint256 _timestamp
    ) external {
        Request memory newRequest = Request({
            email: _email,
            code: _code,
            percentage: _percentage,
            reason: _reason,
            timestamp: _timestamp
        });
        requests[msg.sender].push(newRequest);
    }

    function deleteRequests(
        address sender,
        string memory _email,
        string memory _code
    ) external {
        Request[] storage userRequests = requests[sender];
        uint256 i = 0;

        while (i < userRequests.length) {
            if (
                keccak256(abi.encodePacked(userRequests[i].email)) ==
                keccak256(abi.encodePacked(_email)) &&
                keccak256(abi.encodePacked(userRequests[i].code)) ==
                keccak256(abi.encodePacked(_code))
            ) {
                userRequests[i] = userRequests[userRequests.length - 1];
                userRequests.pop();
            } else {
                i++;
            }
        }
    }

    function getRequests(
        address user
    ) external view returns (Request[] memory) {
        return requests[user];
    }

    function setCountryCurrency(
        Country _country,
        string memory _currency
    ) external onlyOwner {
        countryToCurrency[_country] = _currency;
    }

    function addBalance(Currency _currency) external payable {
        require(msg.value > 0, "Must send ETH value greater than 0");
        require(
            _currency == Currency.Monad,
            "Only ETH (mapped as Monad) supported"
        );
        balance[msg.sender][_currency] += msg.value;
    }

    function withdrawBalance(Currency _currency, uint256 _amount) external {
        require(_amount > 0, "Withdrawal amount must be greater than 0");
        require(
            _currency == Currency.Monad,
            "Only ETH (mapped as Monad) supported"
        );
        require(
            balance[msg.sender][_currency] >= _amount,
            "Insufficient balance"
        );
        balance[msg.sender][_currency] -= _amount;
        (bool sent, ) = payable(msg.sender).call{value: _amount}("");
        require(sent, "Failed to send ETH");
    }

    function getBalance(Currency _currency) external view returns (uint256) {
        return balance[msg.sender][_currency];
    }

    function addRecipients(Will memory _will) external {
        isAdded[msg.sender] = true;
        Recipient[] memory _recipients = _will.recipients;

        uint256 inactivityThreshold = block.timestamp +
            (5 * 365 * 24 * 60 * 60); // 5 years

        recentActivity[msg.sender] = Activity(
            block.timestamp,
            inactivityThreshold
        );

        address[] memory addresses = new address[](_recipients.length);

        for (uint256 i = 0; i < _recipients.length; i++) {
            address recipientAddr = _recipients[i].addr;
            for (uint256 j = 0; j < i; j++) {
                require(
                    addresses[j] != recipientAddr,
                    "Duplicate recipients found"
                );
            }

            addresses[i] = recipientAddr;
        }

        delete inheritence[msg.sender];
        inheritence[msg.sender] = _will;
        bool exists = false;
        for (uint256 i = 0; i < keys.length; i++) {
            if (keys[i] == msg.sender) {
                exists = true;
                break;
            }
        }
        if (!exists) {
            keys.push(msg.sender);
        }
    }

    function getRecipients() public view returns (Recipient[] memory) {
        return inheritence[msg.sender].recipients;
    }

    function getWill() public view returns (Will memory) {
        return inheritence[msg.sender];
    }

    function setStaking(bool _status) external {
        isStaking[msg.sender] = _status;
    }

    function getStaking() external view returns (bool) {
        return isStaking[msg.sender];
    }

    function removeRecipients() external {
        delete inheritence[msg.sender];
        delete isStaking[msg.sender];
    }
}

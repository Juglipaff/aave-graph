pragma solidity >=0.7.0 <0.9.0;
contract premiumAddresses {
    address owner;
    mapping (address => bool) public registeredAddresses;
    
    constructor() {
        owner = msg.sender;
    }
    
    modifier onlyOwner {
        require(
            msg.sender == owner,
            "Only owner can call this function."
        );
        _;
    }
    
    function transferOwnership(address _newOwner) public onlyOwner {
        owner = _newOwner;
    }
    
    function addNewAddress(address newAddress) public onlyOwner{
         require(
             registeredAddresses[newAddress] == false,
             "The address already exists"
        );
        registeredAddresses[newAddress] = true;
    }
    
    function removeAddress(address newAddress) public onlyOwner{
        require(
            registeredAddresses[newAddress] == true,
            "No such address exists"
        );
        registeredAddresses[newAddress] = false;
    }
}
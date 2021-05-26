pragma solidity >=0.4.22 <0.9.0;

contract DappToken {
    // Constructor 
    // Set the tokens
    //Read total number of Tokens
    uint256 public totalSupply;

    function DappToken() public {
        totalSupply = 1000000;

    }
}
pragma solidity >=0.4.22 <0.9.0;

import "./DappToken.sol";

contract DappTokenSale {
    address admin; 
    DappToken public tokenContract;
    uint256 public tokenPrice;
    uint256 public tokensSold;

    event Sell(address indexed _buyer, uint256 _amount);

    // Constructor
    constructor(DappToken _tokenContract, uint256 _tokenPrice) {
        admin = msg.sender;
        tokenContract = _tokenContract;
        tokenPrice = _tokenPrice;
    }

    // Multiply
    function multiply(uint x, uint y) internal pure returns (uint z) {
        require( y == 0 || (z = x * y)/ y == x );
    }

    function buyTokens(uint256 _numberOfTokens) public payable {
        // Require that value is enough to buy the tokens
        require( multiply(_numberOfTokens, tokenPrice) == msg.value);
        // Require that there enough tokens availabe
        require(tokenContract.balanceOf(address(this)) >= _numberOfTokens);
        // require transfer is successful
        require(tokenContract.transfer(msg.sender, _numberOfTokens));
        // keep track of tokens sold
        tokensSold += _numberOfTokens;
        // Trigger sell event
        emit Sell(msg.sender, _numberOfTokens);
    }


    // End the token sale
    function endSale() public  {
        // only admin can end sale
        require(admin == msg.sender);
        // transfer remaining amount of tokens in sale back to the admin
        require(tokenContract.transfer(admin, tokenContract.balanceOf(address(this))));
        // destroy contract 
        selfdestruct(admin);
    }

}
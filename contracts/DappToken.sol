pragma solidity >=0.4.22 <0.9.0;

contract DappToken {
    // Name
    string public name = "DApp Token"; 
    // Symbol
    string public symbol = "DAPP"; 
    // Standard
    string public standard = "DApp Token v1.0";
    // Set the tokens
    //Read total number of Tokens
    uint256 public totalSupply;

    event Transfer(
        address indexed _from,
        address indexed _to,
        uint256 _value
    );

    event Approval(
        address indexed _owner,
        address indexed _spender,
        uint256 _value
    );

    // balance
    mapping(address => uint256) public balanceOf;
    // allowance
    mapping(address =>  mapping(address => uint256)) public allowance; 

    // Constructor
    constructor(uint256 _initialSupply) {
        totalSupply = _initialSupply;
        // Allocate initial supply
        balanceOf[msg.sender] = _initialSupply;
    }

    // Transfer
    function transfer(address _to, uint256 _value) public returns (bool success) {
        // Throws an exception if the sender accont doesn't have enough balance
        //const senderBalance = await msg.sender );
        require(balanceOf[msg.sender] >= _value);
        // Transfer the balance
        balanceOf[msg.sender] -= _value;
        balanceOf[_to]  += _value;

        // Emit the event
        emit Transfer(msg.sender, _to, _value);

        return true;
    }

    // approve
    function approve(address _spender, uint256 _value) public returns (bool success) {
        // handle allowance
        allowance[msg.sender][_spender] = _value;

        // Approve event
        emit Approval(msg.sender, _spender, _value);

        return true; 
    }

    // transfer from 
    function transferFrom(address _from, address _to, uint256 _value) public returns (bool) {
        // Require from has enough tokens
        require(balanceOf[_from] >= _value); 
        // Require allowance is big enough 
        require(allowance[_from][msg.sender] >= _value);
        // Change the balances
        balanceOf[_from] -= _value;
        balanceOf[_to] += _value;
        // Update the allowance
        allowance[_from][msg.sender] -= _value;
        
        // Emit event
        emit Transfer(_from, _to, _value);

        return true; 
    }

}
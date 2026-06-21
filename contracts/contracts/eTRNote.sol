// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";

/// @title eTRNote
/// @notice A *mirror* token for an ISET eTR. It is NON-TRANSFERABLE by default
///         (soulbound). The eTR's control lives in the ISET registry, never in
///         the token — so:
///           • minting requires the registry's reconciler (MINTER_ROLE), and
///           • transfers stay disabled until the registry authorises them.
///         TESTNET-FIRST and flag-gated pending counsel sign-off — do not enable
///         transfers or deploy to mainnet without legal approval.
contract eTRNote is ERC721, AccessControl {
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");

    bool public transfersEnabled;   // registry-authoritative gate (default: false)
    string public verifyBase;       // e.g. https://iset.finance/record/?id=

    struct Mirror { string etrId; bytes32 recordHash; }
    mapping(uint256 => Mirror) public mirror;

    event NoteMinted(uint256 indexed tokenId, address indexed to, string etrId, bytes32 recordHash);
    event TransfersSet(bool enabled);

    constructor(address admin, string memory verifyBase_) ERC721("ISET eTR Note", "eTRN") {
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(MINTER_ROLE, admin);
        verifyBase = verifyBase_;
    }

    function mint(address to, string calldata etrId, bytes32 recordHash)
        external
        onlyRole(MINTER_ROLE)
        returns (uint256 tokenId)
    {
        tokenId = uint256(keccak256(bytes(etrId)));
        mirror[tokenId] = Mirror(etrId, recordHash);
        _safeMint(to, tokenId);
        emit NoteMinted(tokenId, to, etrId, recordHash);
    }

    function setTransfersEnabled(bool enabled) external onlyRole(DEFAULT_ADMIN_ROLE) {
        transfersEnabled = enabled;
        emit TransfersSet(enabled);
    }

    function setVerifyBase(string calldata b) external onlyRole(DEFAULT_ADMIN_ROLE) {
        verifyBase = b;
    }

    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        _requireOwned(tokenId);
        return string.concat(verifyBase, mirror[tokenId].etrId);
    }

    /// @dev Soulbound gate. OZ v5 routes mint/transfer/burn through _update.
    ///      Allow mint (from == 0) and burn (to == 0); block holder-to-holder
    ///      transfers unless the registry has enabled them.
    function _update(address to, uint256 tokenId, address auth) internal override returns (address) {
        address from = _ownerOf(tokenId);
        if (from != address(0) && to != address(0) && !transfersEnabled) {
            revert("eTRNote: non-transferable until registry authorises");
        }
        return super._update(to, tokenId, auth);
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721, AccessControl)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}

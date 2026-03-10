import { expect } from "chai";
import { ethers } from "hardhat";
import { DocChain } from "../typechain-types";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";

describe("DocChain – Phase 1", function () {
  let docChain: DocChain;
  let admin: HardhatEthersSigner;
  let issuer: HardhatEthersSigner;
  let stranger: HardhatEthersSigner;

  const HASH    = "abc123sha256hashvalue";
  const CID     = "QmTestCID123";
  const DOCTYPE = "Degree";

  beforeEach(async () => {
    [admin, issuer, stranger] = await ethers.getSigners();
    const Factory = await ethers.getContractFactory("DocChain");
    docChain = (await Factory.deploy()) as DocChain;
    await docChain.waitForDeployment();
  });

  describe("Role management", () => {
    it("deployer is admin and issuer", async () => {
      expect(await docChain.admin()).to.equal(admin.address);
      expect(await docChain.issuers(admin.address)).to.be.true;
    });

    it("admin can grant issuer", async () => {
      await expect(docChain.grantIssuer(issuer.address))
        .to.emit(docChain, "IssuerGranted")
        .withArgs(issuer.address, admin.address);
      expect(await docChain.issuers(issuer.address)).to.be.true;
    });

    it("admin can revoke issuer", async () => {
      await docChain.grantIssuer(issuer.address);
      await expect(docChain.revokeIssuer(issuer.address))
        .to.emit(docChain, "IssuerRevoked")
        .withArgs(issuer.address, admin.address);
      expect(await docChain.issuers(issuer.address)).to.be.false;
    });

    it("non-admin cannot grant issuer", async () => {
      await expect(
        docChain.connect(stranger).grantIssuer(issuer.address)
      ).to.be.revertedWith("DocChain: caller is not admin");
    });
  });

  describe("storeDocument", () => {
    it("admin (issuer) can store a document and emits event", async () => {
      await expect(docChain.storeDocument(HASH, CID, DOCTYPE))
        .to.emit(docChain, "DocumentStored");
    });

    it("granted issuer can store a document", async () => {
      await docChain.grantIssuer(issuer.address);
      await expect(
        docChain.connect(issuer).storeDocument(HASH, CID, DOCTYPE)
      ).to.emit(docChain, "DocumentStored");
    });

    it("stranger cannot store a document", async () => {
      await expect(
        docChain.connect(stranger).storeDocument(HASH, CID, DOCTYPE)
      ).to.be.revertedWith("DocChain: caller is not an authorised issuer");
    });

    it("cannot store same hash twice", async () => {
      await docChain.storeDocument(HASH, CID, DOCTYPE);
      await expect(
        docChain.storeDocument(HASH, CID, DOCTYPE)
      ).to.be.revertedWith("DocChain: document already exists");
    });
  });

  describe("verifyDocumentView", () => {
    it("returns NotExists for unknown hash", async () => {
      const result = await docChain.verifyDocumentView("unknownhash");
      expect(result.status).to.equal(0);
    });

    it("returns Active after storing", async () => {
      await docChain.storeDocument(HASH, CID, DOCTYPE);
      const result = await docChain.verifyDocumentView(HASH);
      expect(result.status).to.equal(1);
      expect(result.issuedBy).to.equal(admin.address);
      expect(result.ipfsCID).to.equal(CID);
      expect(result.docType).to.equal(DOCTYPE);
    });
  });

  describe("revokeDocument", () => {
    beforeEach(async () => {
      await docChain.storeDocument(HASH, CID, DOCTYPE);
    });

    it("issuer who stored can revoke and emits event", async () => {
      await expect(docChain.revokeDocument(HASH))
        .to.emit(docChain, "DocumentRevoked");
    });

    it("getCertStatus returns Revoked after revoke", async () => {
      await docChain.revokeDocument(HASH);
      expect(await docChain.getCertStatus(HASH)).to.equal(2);
    });

    it("stranger cannot revoke", async () => {
      await expect(
        docChain.connect(stranger).revokeDocument(HASH)
      ).to.be.revertedWith("DocChain: not authorised to revoke");
    });

    it("cannot revoke already revoked document", async () => {
      await docChain.revokeDocument(HASH);
      await expect(docChain.revokeDocument(HASH)).to.be.revertedWith(
        "DocChain: document not active"
      );
    });
  });
});
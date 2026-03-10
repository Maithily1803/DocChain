import { expect } from "chai";
import { ethers } from "hardhat";
import { DocChain } from "../typechain-types";

describe("DocChain – Phase 3 (verifyCount + fraud surface)", function () {
  let docChain: DocChain;
  let admin: any;
  let issuer: any;
  let verifier: any;

  const HASH = "abc123sha256";
  const CID = "QmTestCID";
  const DOCTYPE = "Degree";

  beforeEach(async () => {
    [admin, issuer, verifier] = await (ethers as any).getSigners();

    const Factory = await ethers.getContractFactory("DocChain");
    docChain = (await Factory.deploy()) as DocChain;
    await docChain.waitForDeployment();

    await docChain.storeDocument(HASH, CID, DOCTYPE);
  });

  describe("verifyDocumentView", () => {
    it("returns correct data without changing state", async () => {
      const [status, , , , ipfsCID, docType, count] =
        await docChain.verifyDocumentView(HASH);

      expect(status).to.equal(1);
      expect(ipfsCID).to.equal(CID);
      expect(docType).to.equal(DOCTYPE);
      expect(count).to.equal(0n);
    });

    it("view count stays 0 even after multiple view calls", async () => {
      await docChain.verifyDocumentView(HASH);
      await docChain.verifyDocumentView(HASH);

      const [, , , , , , count] = await docChain.verifyDocumentView(HASH);

      expect(count).to.equal(0n);
    });
  });

  describe("verifyDocument", () => {
    it("increments verifyCount on each call", async () => {
      await docChain.connect(verifier).verifyDocument(HASH);
      await docChain.connect(verifier).verifyDocument(HASH);

      const [, , , , , , count] = await docChain.verifyDocumentView(HASH);

      expect(count).to.equal(2n);
    });

   it("emits DocumentVerified event with correct args", async () => {
  const tx = await docChain.connect(verifier).verifyDocument(HASH);
  const receipt = await tx.wait();
  const block = await ethers.provider.getBlock(receipt!.blockNumber);

  await expect(tx)
    .to.emit(docChain, "DocumentVerified")
    .withArgs(
      HASH,
      verifier.address,
      1,
      block!.timestamp
    );
});

    it("does NOT increment count for unknown hash", async () => {
      await docChain.connect(verifier).verifyDocument("nonexistent");

      const [status] = await docChain.verifyDocumentView("nonexistent");

      expect(status).to.equal(0);
    });
  });

  describe("getVerifyCount", () => {
    it("returns 0 before any verification", async () => {
      expect(await docChain.getVerifyCount(HASH)).to.equal(0n);
    });

    it("matches verifyDocument call count", async () => {
      for (let i = 0; i < 5; i++) {
        await docChain.verifyDocument(HASH);
      }

      expect(await docChain.getVerifyCount(HASH)).to.equal(5n);
    });
  });

  describe("Duplicate hash prevention (fraud surface)", () => {
    it("contract rejects a second store with same hash", async () => {
      await expect(
        docChain.storeDocument(HASH, "QmDifferentCID", DOCTYPE)
      ).to.be.revertedWith("DocChain: document already exists");
    });

    it("different issuer also cannot reuse a hash", async () => {
      await docChain.grantIssuer(issuer.address);

      await expect(
        docChain.connect(issuer).storeDocument(HASH, "QmOtherCID", DOCTYPE)
      ).to.be.revertedWith("DocChain: document already exists");
    });
  });
});

async function latestTs(): Promise<number> {
  const block = await ethers.provider.getBlock("latest");
  return block!.timestamp;
}
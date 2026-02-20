const PINATA_JWT = process.env.NEXT_PUBLIC_PINATA_JWT;
const PINATA_GATEWAY = "https://gateway.pinata.cloud/ipfs";

export async function uploadToIPFS(file: File): Promise<string> {
  if (!PINATA_JWT) {
    throw new Error(
      "Pinata JWT is missing."
    );
  }

  const formData = new FormData();
  formData.append("file", file);

  const pinataMetadata = JSON.stringify({ name: file.name });
  formData.append("pinataMetadata", pinataMetadata);

  const pinataOptions = JSON.stringify({ cidVersion: 1 });
  formData.append("pinataOptions", pinataOptions);

  const response = await fetch(
    "https://api.pinata.cloud/pinning/pinFileToIPFS",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${PINATA_JWT}`,
      },
      body: formData,
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Pinata upload failed (${response.status}): ${errorText}`);
  }

  const data = await response.json();

  if (!data.IpfsHash) {
    throw new Error("Pinata returned no IPFS hash. Check your JWT permissions.");
  }

  return data.IpfsHash;
}

export async function uploadJSONToIPFS(
  jsonData: Record<string, unknown>
): Promise<string> {
  if (!PINATA_JWT) {
    throw new Error("Pinata JWT is missing.");
  }

  const response = await fetch(
    "https://api.pinata.cloud/pinning/pinJSONToIPFS",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${PINATA_JWT}`,
      },
      body: JSON.stringify({
        pinataContent: jsonData,
        pinataMetadata: { name: "DocChain-metadata" },
      }),
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Pinata JSON upload failed (${response.status}): ${errorText}`);
  }

  const data = await response.json();
  return data.IpfsHash;
}

export function getIPFSUrl(cid: string): string {
  if (!cid) return "";
  return `${PINATA_GATEWAY}/${cid}`;
}

export async function testPinataConnection(): Promise<boolean> {
  if (!PINATA_JWT) return false;

  try {
    const response = await fetch(
      "https://api.pinata.cloud/data/testAuthentication",
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${PINATA_JWT}`,
        },
      }
    );
    return response.ok;
  } catch {
    return false;
  }
}
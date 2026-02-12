import { create } from 'ipfs-http-client';

// Using Infura IPFS
const projectId = process.env.NEXT_PUBLIC_INFURA_PROJECT_ID;
const projectSecret = process.env.NEXT_PUBLIC_INFURA_PROJECT_SECRET;
const auth = 'Basic ' + Buffer.from(projectId + ':' + projectSecret).toString('base64');

const client = create({
  host: 'ipfs.infura.io',
  port: 5001,
  protocol: 'https',
  headers: {
    authorization: auth,
  },
});

export async function uploadToIPFS(file: File): Promise<string> {
  try {
    const added = await client.add(file);
    return added.path; // IPFS CID
  } catch (error) {
    console.error('Error uploading to IPFS:', error);
    throw error;
  }
}

export function getIPFSUrl(hash: string): string {
  return `https://ipfs.io/ipfs/${hash}`;
}
export async function generateFileHash(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer(); // read file data
  const hashBuffer = await crypto.subtle.digest('SHA-256', arrayBuffer); // make hash
  const hashArray = Array.from(new Uint8Array(hashBuffer)); // convert to array
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join(''); // to hex string
  return hashHex;
}
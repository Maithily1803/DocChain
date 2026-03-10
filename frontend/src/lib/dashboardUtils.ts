import { ethers } from "ethers";
import { CertStatus } from "./contractUtils";

const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || "";

const ABI = [
  "function verifyDocument(string _hash) external view returns (uint8 status, address issuedBy, uint256 issuedAt, uint256 revokedAt, string ipfsCID, string docType)",
  "function issuers(address) view returns (bool)",
  "event DocumentStored(string indexed hashKey, address indexed issuedBy, string ipfsCID, string docType, uint256 issuedAt)",
  "event DocumentRevoked(string indexed hashKey, address indexed revokedBy, uint256 revokedAt)",
  "event IssuerGranted(address indexed issuer, address indexed grantedBy)",
];

export interface RawStoredEvent {
  hash: string;
  issuedBy: string;
  ipfsCID: string;
  docType: string;
  issuedAt: Date;
  txHash: string;
  blockNum: number;
}

export interface RawRevokedEvent {
  hash: string;
  revokedBy: string;
  revokedAt: Date;
  txHash: string;
}

export interface InstitutionStats {
  address: string;
  totalIssued: number;
  totalRevoked: number;
  activeCount: number;
  byCategory: Record<string, number>;
  issuanceTimeline: { date: string; count: number }[];
  lastActivity: Date | null;
}

export interface FraudAlert {
  type: "DUPLICATE_HASH" | "CID_REUSE" | "RAPID_BULK";
  severity: "HIGH" | "MEDIUM" | "LOW";
  description: string;
  hashes: string[];
  addresses: string[];
  detectedAt: Date;
}

export interface DashboardData {
  globalTotalIssued: number;
  globalTotalRevoked: number;
  globalActiveCount: number;
  institutionCount: number;
  institutions: InstitutionStats[];
  fraudAlerts: FraudAlert[];
  storedEvents: RawStoredEvent[];
  globalTimeline: { date: string; count: number }[];
  fetchedAt: Date;
}

async function getProvider(): Promise<ethers.BrowserProvider | ethers.JsonRpcProvider> {
  if (typeof window !== "undefined" && window.ethereum) {
    return new ethers.BrowserProvider(window.ethereum);
  }
  const rpc = process.env.NEXT_PUBLIC_SEPOLIA_RPC || "https://rpc.sepolia.org";
  return new ethers.JsonRpcProvider(rpc);
}

function buildTimeline(
  events: { issuedAt: Date }[],
  days = 30
): { date: string; count: number }[] {
  const now = Date.now();
  const cutoff = now - days * 86400_000;

  const map: Record<string, number> = {};

  for (let d = 0; d < days; d++) {
    const dt = new Date(now - d * 86400_000);
    const key = dt.toISOString().slice(0, 10);
    map[key] = 0;
  }

  events.forEach(({ issuedAt }) => {
    if (issuedAt.getTime() >= cutoff) {
      const key = issuedAt.toISOString().slice(0, 10);
      if (key in map) map[key] = (map[key] ?? 0) + 1;
    }
  });

  return Object.entries(map)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, count]) => ({ date, count }));
}

function detectFraud(
  storedEvents: RawStoredEvent[],
  revokedEvents: RawRevokedEvent[]
): FraudAlert[] {
  const alerts: FraudAlert[] = [];
  const now = new Date();

  const hashToIssuers = new Map<string, string[]>();
  for (const ev of storedEvents) {
    const existing = hashToIssuers.get(ev.hash) ?? [];
    if (!existing.includes(ev.issuedBy)) {
      existing.push(ev.issuedBy);
      hashToIssuers.set(ev.hash, existing);
    }
  }

  hashToIssuers.forEach((addrs, hash) => {
    if (addrs.length > 1) {
      alerts.push({
        type: "DUPLICATE_HASH",
        severity: "HIGH",
        description: `Document hash ${hash.slice(0, 12)}… was stored by ${addrs.length} different institutions. Possible document forgery.`,
        hashes: [hash],
        addresses: addrs,
        detectedAt: now,
      });
    }
  });

  const cidToHashes = new Map<string, string[]>();
  for (const ev of storedEvents) {
    if (!ev.ipfsCID) continue;
    const existing = cidToHashes.get(ev.ipfsCID) ?? [];
    if (!existing.includes(ev.hash)) {
      existing.push(ev.hash);
      cidToHashes.set(ev.ipfsCID, existing);
    }
  }

  cidToHashes.forEach((hashes, cid) => {
    if (hashes.length > 1) {
      const addrs = [
        ...new Set(
          storedEvents
            .filter((e) => hashes.includes(e.hash))
            .map((e) => e.issuedBy)
        ),
      ];
      alerts.push({
        type: "CID_REUSE",
        severity: "HIGH",
        description: `IPFS CID ${cid.slice(0, 16)}… linked to ${hashes.length} different document hashes. Same file issued multiple times with different IDs.`,
        hashes,
        addresses: addrs,
        detectedAt: now,
      });
    }
  });

  const issuerEvents = new Map<string, Date[]>();
  for (const ev of storedEvents) {
    const arr = issuerEvents.get(ev.issuedBy) ?? [];
    arr.push(ev.issuedAt);
    issuerEvents.set(ev.issuedBy, arr);
  }

  const WINDOW_MS = 10 * 60 * 1000;
  const BURST_THRESH = 20;

  issuerEvents.forEach((times, addr) => {
    const sorted = [...times].sort((a, b) => a.getTime() - b.getTime());
    for (let i = 0; i < sorted.length; i++) {
      const windowEnd = sorted[i].getTime() + WINDOW_MS;
      let count = 0;
      for (let j = i; j < sorted.length && sorted[j].getTime() <= windowEnd; j++) {
        count++;
      }
      if (count >= BURST_THRESH) {
        alerts.push({
          type: "RAPID_BULK",
          severity: "MEDIUM",
          description: `Institution ${addr.slice(0, 8)}… issued ${count} documents within a 10-minute window. Possible automated fraud or system abuse.`,
          hashes: [],
          addresses: [addr],
          detectedAt: now,
        });
        break;
      }
    }
  });

  return alerts;
}

export async function fetchDashboardData(): Promise<DashboardData> {
  if (!CONTRACT_ADDRESS) {
    throw new Error(
      "Contract address not set. Add NEXT_PUBLIC_CONTRACT_ADDRESS to .env.local"
    );
  }

  const provider = await getProvider();
  const contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, provider);

  const [storedLogs, revokedLogs] = await Promise.all([
    contract.queryFilter(contract.filters.DocumentStored(), 0, "latest"),
    contract.queryFilter(contract.filters.DocumentRevoked(), 0, "latest"),
  ]);

  const storedEvents: RawStoredEvent[] = storedLogs.map((ev) => {
    const log = ev as ethers.EventLog;
    return {
      hash: log.args?.[0] ?? "",
      issuedBy: log.args?.[1] ?? "",
      ipfsCID: log.args?.[2] ?? "",
      docType: log.args?.[3] ?? "",
      issuedAt: new Date(Number(log.args?.[4] ?? 0) * 1000),
      txHash: ev.transactionHash,
      blockNum: ev.blockNumber,
    };
  });

  const revokedEvents: RawRevokedEvent[] = revokedLogs.map((ev) => {
    const log = ev as ethers.EventLog;
    return {
      hash: log.args?.[0] ?? "",
      revokedBy: log.args?.[1] ?? "",
      revokedAt: new Date(Number(log.args?.[2] ?? 0) * 1000),
      txHash: ev.transactionHash,
    };
  });

  const revokedHashSet = new Set(revokedEvents.map((e) => e.hash));

  const issuerMap = new Map<string, RawStoredEvent[]>();
  for (const ev of storedEvents) {
    const arr = issuerMap.get(ev.issuedBy) ?? [];
    arr.push(ev);
    issuerMap.set(ev.issuedBy, arr);
  }

  const institutions: InstitutionStats[] = [];

  issuerMap.forEach((events, address) => {
    const revokedCount = events.filter((e) => revokedHashSet.has(e.hash)).length;
    const activeCount = events.length - revokedCount;

    const byCategory: Record<string, number> = {};
    events.forEach((e) => {
      byCategory[e.docType] = (byCategory[e.docType] ?? 0) + 1;
    });

    const lastActivity =
      events
        .map((e) => e.issuedAt)
        .sort((a, b) => b.getTime() - a.getTime())[0] ?? null;

    institutions.push({
      address,
      totalIssued: events.length,
      totalRevoked: revokedCount,
      activeCount,
      byCategory,
      issuanceTimeline: buildTimeline(events),
      lastActivity,
    });
  });

  institutions.sort((a, b) => b.totalIssued - a.totalIssued);

  const globalTotalIssued = storedEvents.length;
  const globalTotalRevoked = revokedEvents.length;
  const globalActiveCount = globalTotalIssued - globalTotalRevoked;
  const globalTimeline = buildTimeline(storedEvents);

  const fraudAlerts = detectFraud(storedEvents, revokedEvents);

  return {
    globalTotalIssued,
    globalTotalRevoked,
    globalActiveCount,
    institutionCount: institutions.length,
    institutions,
    fraudAlerts,
    storedEvents,
    globalTimeline,
    fetchedAt: new Date(),
  };
}
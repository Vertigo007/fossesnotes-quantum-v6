import os from 'node:os';

const PRIVATE = /^(192\.168\.|10\.|172\.(1[6-9]|2\d|3[01])\.)/;

/** This computer's address on the home Wi-Fi, so the phone can reach the server. */
export function lanAddress() {
  const candidates = [];
  for (const [name, addrs] of Object.entries(os.networkInterfaces())) {
    for (const a of addrs || []) {
      if (a.family !== 'IPv4' || a.internal || !PRIVATE.test(a.address)) continue;
      // Skip virtual adapters (VirtualBox, Hyper-V, WSL, Docker, VPNs).
      if (/virtual|vbox|vmware|hyper-v|vethernet|wsl|docker|br-|tun|tap|zerotier|tailscale/i.test(name)) continue;
      candidates.push(a.address);
    }
  }
  // Home routers almost always hand out 192.168.x.x.
  return candidates.find((a) => a.startsWith('192.168.')) || candidates[0] || null;
}

export const isLoopback = (addr) => ['127.0.0.1', '::1', '::ffff:127.0.0.1'].includes(addr);

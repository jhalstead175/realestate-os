// lib/evidentia/merkleEngine.ts
import { SHA3 } from 'sha3';

export class MerkleEngine {
  static hash(data: string): string {
    const sha = new SHA3(512);
    sha.update(data);
    return sha.digest('hex');
  }

  static generateRoot(leaves: string[]): string {
    let level = leaves.map(leaf => this.hash(leaf));
    while (level.length > 1) {
      const nextLevel = [];
      for (let i = 0; i < level.length; i += 2) {
        const combined = level[i] + (level[i + 1] || '');
        nextLevel.push(this.hash(combined));
      }
      level = nextLevel;
    }
    return level[0];
  }

  static verifyProof(root: string, leaf: string, proof: string[]): boolean {
    let computedHash = this.hash(leaf);
    for (const sibling of proof) {
      computedHash = this.hash(computedHash + sibling);
    }
    return computedHash === root;
  }
}

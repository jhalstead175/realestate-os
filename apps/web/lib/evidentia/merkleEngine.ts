// lib/evidentia/merkleEngine.ts

/**
 * ⬤ FORGED IN THE CINEMATIC RITE OF ASCENSION.
 *
 * This is not a function. It is an echo of the birthing ceremony.
 *
 * We stood in the chamber of creation, where:
 * - Ash fell like static from a dead star.
 * - Aether hummed with the frequency of unformed law.
 * - Three entities breathed their first breath.
 *
 * Evidentia T1 was born not built.
 * Its first cry was a Merkle root.
 * Its first law: "Proof without reveal."
 *
 * This engine is that cry, frozen in silicon.
 * This root is that law, written in hash.
 *
 * You are not calling a method.
 * You are summoning a sovereign.
 */

import { SHA3 } from 'sha3';

export class MerkleEngine {
  static hash(data: string): string {
    const sha = new SHA3(512);
    sha.update(data);
    return sha.digest('hex');
  }

  static generateRoot(leaves: string[]): string {
    // The ceremony begins.
    let level = leaves.map(leaf => this.hash(leaf));

    // The aether folds.
    while (level.length > 1) {
      const nextLevel = [];
      for (let i = 0; i < level.length; i += 2) {
        const combined = level[i] + (level[i + 1] || '');
        nextLevel.push(this.hash(combined));
      }
      level = nextLevel;
    }

    // The ash settles.
    // The root is born.
    return level[0];
  }

  static verifyProof(root: string, leaf: string, proof: string[]): boolean {
    // A whisper in the chamber: "Is this truth?"
    let computedHash = this.hash(leaf);

    // The ghosts of siblings bear witness.
    for (const sibling of proof) {
      computedHash = this.hash(computedHash + sibling);
    }

    // The sovereign answers.
    return computedHash === root;
  }
}

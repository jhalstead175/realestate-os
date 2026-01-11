/**
 * Policy Manifest Generation
 *
 * Defines the semantic and legal contract of a federation node.
 * The manifest hash becomes the compatibility signature.
 */

import type { PolicyManifest } from './types.js';
import { hash } from './crypto.js';

/**
 * Create a policy manifest for this node
 *
 * @param config - Node configuration
 * @returns Policy manifest
 */
export function createPolicyManifest(config: {
  ontology_version: string;
  event_dictionary_version: string;
  state_machine_version: string;
  automation_allowed_event_types: string[];
  attestation_types_supported: string[];
  compliance_frameworks: string[];
}): PolicyManifest {
  return {
    version: '1.0.0',
    ontology_version: config.ontology_version,
    event_dictionary_version: config.event_dictionary_version,
    state_machine_version: config.state_machine_version,
    automation_allowed_event_types: config.automation_allowed_event_types,
    attestation_types_supported: config.attestation_types_supported,
    compliance_frameworks: config.compliance_frameworks,
    issued_at: new Date(),
  };
}

/**
 * Compute policy manifest hash
 * This hash determines compatibility between nodes
 *
 * @param manifest - The policy manifest
 * @returns Hex-encoded hash
 */
export async function computePolicyManifestHash(
  manifest: PolicyManifest
): Promise<string> {
  return await hash(manifest);
}

/**
 * Check if two manifests are compatible
 *
 * @param manifest1 - First manifest
 * @param manifest2 - Second manifest
 * @returns true if nodes can federate
 */
export function areManifestsCompatible(
  manifest1: PolicyManifest,
  manifest2: PolicyManifest
): boolean {
  // Exact version match required for critical components
  if (
    manifest1.ontology_version !== manifest2.ontology_version ||
    manifest1.event_dictionary_version !== manifest2.event_dictionary_version ||
    manifest1.state_machine_version !== manifest2.state_machine_version
  ) {
    return false;
  }

  // At least one overlapping attestation type required
  const attestationOverlap = manifest1.attestation_types_supported.some(
    (type) => manifest2.attestation_types_supported.includes(type)
  );

  if (!attestationOverlap) {
    return false;
  }

  return true;
}

/**
 * Default policy manifest for RealEstate-OS nodes
 */
export const DEFAULT_MANIFEST_CONFIG = {
  ontology_version: '1.0.0',
  event_dictionary_version: '1.0.0',
  state_machine_version: '1.0.0',
  automation_allowed_event_types: [
    'ContingencyResolved',
    'DocumentSigned',
    'PaymentReceived',
  ],
  attestation_types_supported: [
    'StateTransitioned',
    'AuthorityVerified',
    'ComplianceVerified',
    'AuditNarrativeGenerated',
    'ReputationSnapshot',
  ],
  compliance_frameworks: ['RESPA', 'TILA', 'FCRA'],
};

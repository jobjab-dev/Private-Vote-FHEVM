/**
 * FHEVM SDK Integration for Web Application
 * Following official Zama docs: web_app.md and input.md
 */

// Global types for CDN loaded relayerSDK
declare global {
  interface Window {
    relayerSDK?: {
      initSDK: () => Promise<void>;
      createInstance: (config: any) => Promise<any>;
      SepoliaConfig: any;
    };
  }
}

let fhevmInstance: any = null;
let isSDKInitialized = false;

/**
 * Check if we're in browser environment
 */
function isBrowser(): boolean {
  return typeof window !== 'undefined';
}

/**
 * Load relayerSDK - tries CDN first, then npm package as fallback
 */
async function loadRelayerSDK(): Promise<any> {
  if (!isBrowser()) {
    throw new Error('FHEVM SDK requires browser environment');
  }

  // Try CDN first (recommended by docs)
  console.log('🔍 Checking for CDN relayerSDK...');
  let attempts = 0;
  const maxAttempts = 30; // 3 seconds max wait for CDN
  
  while (!window.relayerSDK && attempts < maxAttempts) {
    await new Promise(resolve => setTimeout(resolve, 100));
    attempts++;
  }

  if (window.relayerSDK) {
    console.log('✅ Using CDN relayerSDK');
    return window.relayerSDK;
  }

  // Fallback to npm package bundle import as per docs
  console.log('📦 CDN not available, using npm package bundle...');
  try {
    const bundle = await import('@zama-fhe/relayer-sdk/bundle');
    console.log('✅ Using npm package bundle');
    return bundle;
  } catch (error) {
    console.error('❌ Failed to load npm package bundle:', error);
    throw new Error('Both CDN and npm package failed to load');
  }
}

/**
 * Initialize FHEVM SDK following docs: web_app.md Step 2
 */
async function initializeSDK(): Promise<any> {
  if (isSDKInitialized) {
    console.log('🔄 FHEVM SDK already initialized');
    return null;
  }

  try {
    const sdk = await loadRelayerSDK();
    
    console.log('🚀 Initializing FHEVM SDK (loading WASM)...');
    await sdk.initSDK(); // Load needed WASM as per docs
    isSDKInitialized = true;
    console.log('✅ FHEVM SDK (WASM) initialized successfully');
    return sdk;
  } catch (error) {
    console.error('❌ Failed to initialize FHEVM SDK:', error);
    throw new Error('FHEVM SDK initialization failed');
  }
}

/**
 * Create FHEVM instance following docs: web_app.md Step 3
 */
export async function initializeFHEVM(): Promise<any> {
  if (fhevmInstance) {
    console.log('🔄 FHEVM instance already initialized');
    return fhevmInstance;
  }

  if (!isBrowser()) {
    throw new Error('FHEVM requires browser environment');
  }

  try {
    // Step 1: Initialize SDK first
    const sdk = await initializeSDK();
    
    console.log('🚀 Creating FHEVM instance with Sepolia config...');
    
    // Step 2: Create instance following docs exactly  
    const actualSDK = sdk || await loadRelayerSDK(); // Use SDK from init or load fresh
    
    const config = { 
      ...actualSDK.SepoliaConfig, 
      network: (window as any).ethereum // Use MetaMask provider as per docs
    };
    
    fhevmInstance = await actualSDK.createInstance(config);
    
    console.log('✅ FHEVM instance created successfully');
    return fhevmInstance;
    
  } catch (error) {
    console.error('❌ Failed to initialize FHEVM instance:', error);
    throw new Error('FHEVM initialization failed');
  }
}

/**
 * Get the FHEVM instance (initialize if needed)
 */
export async function getFHEVMInstance(): Promise<any> {
  if (fhevmInstance) {
    return fhevmInstance;
  }
  
  return await initializeFHEVM();
}

/**
 * Encrypt vote input following docs: input.md
 */
export async function encryptVoteInput(
  contractAddress: string, 
  userAddress: string,
  voteValue: bigint = BigInt(1)
): Promise<{
  encryptedVote: string;
  inputProof: string;
}> {
  if (!isBrowser()) {
    throw new Error('Vote encryption requires browser environment');
  }

  try {
    console.log('🔒 Encrypting vote input following input.md docs...', {
      contractAddress,
      userAddress,
      voteValue: voteValue.toString()
    });

    // Get FHEVM instance
    const instance = await getFHEVMInstance();
    
    // Create encrypted input buffer as per docs
    const buffer = instance.createEncryptedInput(
      contractAddress,  // Contract address allowed to interact with ciphertexts
      userAddress      // User address allowed to import ciphertexts
    );

    // Add the vote value (1) as euint64 as per docs
    buffer.add64(voteValue);

    // Encrypt and upload to relayer as per docs
    console.log('⏳ Encrypting and uploading to relayer...');
    const ciphertexts = await buffer.encrypt();
    
    console.log('✅ Vote input encrypted and uploaded successfully');
    console.log('📄 Ciphertext data:', {
      handles: ciphertexts.handles?.length || 0,
      inputProof: ciphertexts.inputProof ? 'present' : 'missing'
    });
    
    // Debug handle format
    const handle = ciphertexts.handles[0];
    console.log('🔍 Handle debug:', {
      type: typeof handle,
      isArray: Array.isArray(handle),
      isUint8Array: handle instanceof Uint8Array,
      value: handle,
      length: handle?.length
    });
    
    // Convert handle to hex string if needed
    let encryptedVoteHex: string;
    if (typeof handle === 'string') {
      encryptedVoteHex = handle.startsWith('0x') ? handle : '0x' + handle;
    } else if (handle instanceof Uint8Array) {
      encryptedVoteHex = '0x' + Array.from(handle).map(b => b.toString(16).padStart(2, '0')).join('');
    } else {
      console.error('❌ Unknown handle format:', handle);
      throw new Error('Invalid handle format from FHEVM SDK');
    }
    
    console.log('🔄 Converted handle to hex:', encryptedVoteHex);
    
    // Ensure inputProof is hex string
    let inputProofHex: string;
    if (typeof ciphertexts.inputProof === 'string') {
      inputProofHex = ciphertexts.inputProof.startsWith('0x') ? ciphertexts.inputProof : '0x' + ciphertexts.inputProof;
    } else if (ciphertexts.inputProof instanceof Uint8Array) {
      inputProofHex = '0x' + Array.from(ciphertexts.inputProof).map((b: number) => b.toString(16).padStart(2, '0')).join('');
    } else {
      inputProofHex = ciphertexts.inputProof;
    }
    
    console.log('📝 Final values for contract:', {
      encryptedVote: encryptedVoteHex,
      inputProof: inputProofHex?.slice(0, 20) + '...'
    });
    
    return {
      encryptedVote: encryptedVoteHex,
      inputProof: inputProofHex,
    };
    
  } catch (error) {
    console.error('❌ Failed to encrypt vote input:', error);
    throw new Error(`Vote encryption failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

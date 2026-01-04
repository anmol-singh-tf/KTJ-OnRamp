import cv2
import numpy as np
import hashlib
import os

try:
    from fuzzy_extractor import FuzzyExtractor
except ImportError:
    print("Warning: fuzzy_extractor not found. Using MockFuzzyExtractor.")
    class FuzzyExtractor:
        def __init__(self, precision, error_precision):
            self.precision = precision
            self.error_precision = error_precision

        def generate(self, data):
            # Deterministic key from data
            key = hashlib.sha256(data).digest()
            # Random helper data (simulated)
            helper = os.urandom(32)
            return key, helper

        def reproduce(self, data, helper):
            # In a real fuzzy extractor, helper + noisy data -> original key.
            # Here we just re-hash the data. 
            # Note: This Mock does NOT handle noise. Input must be identical.
            return hashlib.sha256(data).digest()

def image_to_feature_vector(image_path):
    """
    Reads an image, converts to grayscale, thresholds to binary,
    and flattens to a bytes string.
    """
    # Read image in grayscale
    img = cv2.imread(image_path, cv2.IMREAD_GRAYSCALE)
    if img is None:
        raise ValueError(f"Could not read image at {image_path}")

    # Resize to specific dimensions to ensure consistent vector size
    # Assuming a standard size for fingerprints, e.g., 200x200
    img = cv2.resize(img, (200, 200))

    # Threshold to binary (0 or 255)
    _, thresh = cv2.threshold(img, 127, 255, cv2.THRESH_BINARY)

    # Flatten the array
    flat = thresh.flatten()
    
    # Convert to bytes
    return flat.tobytes()

def derive_key(fingerprint_path, helper_data=None):
    """
    Derives a private key from a fingerprint image.
    If helper_data is None, it generates new helper_data (Registration).
    If helper_data is provided, it reproduces the key (Login/Payment).
    """
    fingerprint_bytes = image_to_feature_vector(fingerprint_path)
    
    # Initialize Fuzzy Extractor
    # accuracy=16, error_precision=6
    extractor = FuzzyExtractor(16, 6) 

    if helper_data is None:
        # Generate new key and helper data
        k, h = extractor.generate(fingerprint_bytes)
        return k, h
    else:
        # Reproduce key from noisy input + helper data
        k = extractor.reproduce(fingerprint_bytes, helper_data)
        return k

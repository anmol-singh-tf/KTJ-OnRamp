import cv2
import numpy as np

# Create a dummy image (grayscale)
img = np.zeros((200, 200), dtype=np.uint8)
# Add some "features" (random noise/lines)
for i in range(0, 200, 10):
    cv2.line(img, (i, 0), (i, 200), (255), 1)
    cv2.line(img, (0, i), (200, i), (255), 1)

cv2.imwrite('dummy_fingerprint.png', img)
print("Created dummy_fingerprint.png")
